import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::article.article', ({ strapi }) => ({
 
  async fetchBookmarks(ctx) {
    const userId = ctx.state.user?.id;
  
    if (!userId) {
      return ctx.throw(401, 'User not authenticated');
    }
  
    try {
      // Fetch the user with related articles
      
      const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
        populate: ['news'],
      });

      
      if (!user) {
        return ctx.throw(404, 'User not found');
      }
  
      return ctx.send({ message: 'Successfully retrieved bookmarks', user });
    } catch (error) {
      return ctx.throw(500, `Error fetching followed articles: ${error.message}`);
    }
  },
  
  // Follow an article
  async addbookmark(ctx) {
    const userId = ctx.state.user.id; // Get the logged-in user's ID
    const { articleId } = ctx.request.body; // The article to follow

    if (!articleId) {
      return ctx.throw(400, 'Article ID is required');
    }

    try {
      // Find the article by its ID
      const article = await strapi.entityService.findOne('api::article.article', articleId);
      if (!article) {
        return ctx.throw(404, 'Article not found');
      }

      // Find the user and update their followed_articles field
      const user = await strapi.plugins['users-permissions'].services.user.edit(userId, {
        news: [...(ctx.state.user.news || []), articleId], // Add article ID to followed list
      });

      return ctx.send({ message: 'Successfully followed the article', user });
    } catch (error) {
      return ctx.throw(500, `Error following article: ${error.message}`);
    }
  },

  // Unfollow an article
  async removebookmark(ctx) {
    const userId = ctx.state.user.id; // Get the logged-in user's ID
    const { articleId } = ctx.request.body; // The article to unfollow

    if (!articleId) {
      return ctx.throw(400, 'Article ID is required');
    }

    try {
      // Remove the unfollowed article from the followed_articles array
      const user = await strapi.plugins['users-permissions'].services.user.edit(userId, {
        news: (ctx.state.user.news || []).filter((id: number) => id !== articleId), // Remove article ID
      });

      return ctx.send({ message: 'Successfully unfollowed the article', user });
    } catch (error) {
      return ctx.throw(500, `Error unfollowing article: ${error.message}`);
    }
  },

  async fetchAllNews(ctx) {
    const query = ctx.query as Record<string, any>; // Explicitly cast query to a record

    const page = parseInt(query.page || '1', 10); // Default to page 1
    const pageSize = parseInt(query.pageSize || '10', 10); // Default page size is 10

    try {
      // Fetch all articles with pagination
      const articles = await strapi.entityService.findMany('api::article.article', {
        ...query,
        pagination: { page, pageSize },
        populate: '*',
      });

      // Count total articles for pagination metadata
      const total = await strapi.entityService.count('api::article.article', {
        ...query,
      });

      const totalPages = Math.ceil(total / pageSize);

      return ctx.send({
        articles,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      });
    } catch (error) {
      return ctx.throw(500, `Error fetching all news: ${error.message}`);
    }
  },

  // Function to fetch today's news details
  async fetchTodaysNews(ctx) {
    const query = ctx.query as Record<string, any>; // Explicitly cast query to a record
  
    const page = parseInt(query.page || '1', 10); // Default to page 1
    const pageSize = parseInt(query.pageSize || '10', 10); // Default page size is 10
  
    // Get today's date in UTC
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0); // Start of the day in UTC
  
    const tomorrowUTC = new Date(todayUTC);
    tomorrowUTC.setDate(todayUTC.getDate() + 1); // Start of the next day in UTC
  
    // Safely merge filters
    const filters = {
      ...(query.filters && typeof query.filters === 'object' ? query.filters : {}),
      updatedAt: {
        $gte: todayUTC.toISOString(),
        $lt: tomorrowUTC.toISOString(),
      },
    };
  
    try {
      // Fetch articles with pagination
      const articles = await strapi.entityService.findMany('api::article.article', {
        ...query,
        filters, // Apply the merged filters
        pagination: { page, pageSize },
        populate: '*',
      });
  
      // Count total articles for pagination metadata
      const total = await strapi.entityService.count('api::article.article', {
        filters,
      });
  
      const totalPages = Math.ceil(total / pageSize);
  
      // Fetch recent searches for logged-in users
      const userId = ctx.state.user?.id;
      const user = userId
        ? await strapi.entityService.findOne('plugin::users-permissions.user', userId)
        : null;
      const recentSearch = user?.recentsearch || [];
  
      // Fetch global popular tags
      const popularTags = await strapi.services['api::tag.tag'].getPopularTags();
  
      return ctx.send({
        articles,
        recentSearch,
        popularTags,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      });
    } catch (error) {
      return ctx.throw(500, `Error fetching today's news: ${error.message}`);
    }
  },

  async search(ctx) { 
    const { query, page = 1, pageSize = 10 } = ctx.request.body; // Search text and pagination params
    const userId = ctx.state.user?.id;
  
    if (!query) {
      return ctx.throw(400, 'Search query is required');
    }
  
    if (!userId) {
      return ctx.throw(401, 'User not authenticated');
    }
  
    try {
      // Fetch articles based on the search query (title, description) with pagination
      const articles = await strapi.entityService.findPage('api::article.article', {
        filters: {
          $or: [
            { title: { $containsi: query } },
            { description: { $containsi: query } },
          ],
        },
        populate: '*',
        pagination: {
          page: Number(page),
          pageSize: Number(pageSize),
        },
      });
  
      // Map article data for the "People" section
      let people = articles.results.map((article) => ({
        id: article.id,
        title: article.title,
        description: article.description,
        slug: article.slug,
        createdAt: article.createdAt,
        newslink: article.newslink,
        cover: article['cover'],
        category: article['category'],
      }));
  
      // If no articles found, search for categories matching the query
      if (people.length === 0) {
        const categories = await strapi.entityService.findMany('api::category.category', {
          filters: { name: { $containsi: query } },
        });
  
        if (categories.length > 0) {
          const categoryIds = categories.map((category) => category.id);
  
          // Fetch related articles by category with pagination
          const relatedArticles = await strapi.entityService.findPage('api::article.article', {
            filters: { category: { id: { $in: categoryIds } } },
            populate: '*',
            pagination: {
              page: Number(page),
              pageSize: Number(pageSize),
            },
          });
  
          // Map related articles to "People" section
          people = relatedArticles.results.map((article) => ({
            id: article.id,
            title: article.title,
            description: article.description,
            slug: article.slug,
            createdAt: article.createdAt,
            newslink: article.newslink,
            cover: article['cover'],
            category: article['category'],
          }));
        }
      }
  
      // Fetch categories from category controller logic
      const categoryResults = await strapi.service('api::category.category').searchCategories(query, articles.results);
  
      // Return combined search results with pagination info
      return ctx.send({
        message: 'Search results',
        data: {
          people,  // Articles matching query or related to categories
          events: categoryResults, 
          pagination: articles.pagination,  // Include pagination info
        },
      });
    } catch (error) {
      return ctx.throw(500, `Error fetching search results: ${error.message}`);
    }
  }
  
  
  
  
}));
