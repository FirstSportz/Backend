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
    const queryParams = ctx.query as Record<string, any>; // Extract query parameters
    
    const page = parseInt(queryParams.page || '1', 10); // Default to page 1
    const pageSize = parseInt(queryParams.pageSize || '10', 10); // Default page size is 10
  
    const searchQuery = ctx.request.body.query;
    const userId = ctx.state.user?.id;
  
    if (!searchQuery) {
      return ctx.throw(400, 'Search query is required');
    }
  
    if (!userId) {
      return ctx.throw(401, 'User not authenticated');
    }
  
    try {
      // Filters for searching articles by title or description
      const filters = {
        $or: [
          { title: { $containsi: searchQuery } },
          { description: { $containsi: searchQuery } },
        ],
      };
  
      // Fetch paginated articles
      const articles = await strapi.entityService.findMany('api::article.article', {
        filters,
        populate: '*',
        pagination: { page, pageSize },
      });
  
      // Count total articles for pagination metadata
      const totalArticles = await strapi.entityService.count('api::article.article', { filters });
      const totalPages = Math.ceil(totalArticles / pageSize);
  
      // Map articles for the "People" section
      let people = articles.map((article) => ({
        id: article.id,
        title: article.title,
        description: article.description,
        slug: article.slug,
        createdAt: article.createdAt,
        newslink: article.newslink,
        cover: article['cover'],
        category: article['category'],
      }));
  
      // Handle category search when no matching articles are found
      if (people.length === 0) {
        const categories = await strapi.entityService.findMany('api::category.category', {
          filters: { name: { $containsi: searchQuery } },
        });
  
        if (categories.length > 0) {
          const categoryIds = categories.map((category) => category.id);
  
          // Fetch related articles by category
          const relatedArticles = await strapi.entityService.findMany('api::article.article', {
            filters: { category: { id: { $in: categoryIds } } },
            populate: '*',
            pagination: { page, pageSize },
          });
  
          // Map related articles
          people = relatedArticles.map((article) => ({
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
  
      // Fetch category results for events
      const categoryResults = await strapi.service('api::category.category').searchCategories(searchQuery, articles);
  
      // Return combined results with pagination metadata
      return ctx.send({
        message: 'Search results',
        data: {
          people,
          events: categoryResults,
          pagination: {
            page,
            pageSize,
            total: totalArticles,
            totalPages,
          },
        },
      });
    } catch (error) {
      return ctx.throw(500, `Error fetching search results: ${error.message}`);
    }
  },

  async addToHistory(ctx) {
    try {
      const userId = ctx.state.user?.id; // Get the logged-in user's ID
      const { articleId } = ctx.request.body; // The article to add to history
  
      if (!articleId) {
        return ctx.throw(400, 'Article ID is required');
      }
  
      // Fetch the user's current history directly from the database
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
        populate: ['histories'],
      });
  
      if (!user) {
        return ctx.throw(404, 'User not found');
      }
  
      // Extract current history IDs
      const currentHistoryIds = user.histories.map((entry) => entry.id);
  
      // Check for duplicates
      if (currentHistoryIds.includes(articleId)) {
        return ctx.send({ message: 'Article already exists in history' });
      }
  
      // Append new article ID to the history list
      currentHistoryIds.push(articleId);
  
      // Update the user's history
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data: {
          histories: currentHistoryIds.map((id) => ({ id })),
        },
      });
  
      return ctx.send({ message: 'Successfully added the article to history' });
    } catch (error) {
      return ctx.throw(500, `Error adding article to history: ${error.message}`);
    }
  },
  

  
 
  
  
  async fetchReadingHistory(ctx) {
    const userId = ctx.state.user?.id;
  
    if (!userId) {
      return ctx.throw(401, 'User not authenticated');
    }
  
    // Extract pagination parameters from query
    const query = ctx.query as Record<string, any>;
    const page = parseInt(query.page || '1', 10); // Default to page 1
    const pageSize = parseInt(query.pageSize || '10', 10); // Default page size is 10
  
    try {
      // Fetch user's histories with pagination applied
      const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
        populate: '*', 
        pagination: { page, pageSize },
      });
  
    

      if (!user || !user['histories'].length) {
        return ctx.send({
          message: 'No reading history found',
          data: { history: [] },
          pagination: { page, pageSize, total: 0, totalPages: 0 },
        });
      }
  
      const historyIds = user['histories'].map((history) => history.id);
  
      // Fetch full article data for each history entry using the IDs
      const [articles, total] = await Promise.all([
        strapi.entityService.findMany('api::article.article', {
          filters: { id: { $in: historyIds } },
          populate: ['cover', 'category'],
        }),
        strapi.entityService.count('api::article.article', {
          filters: { id: { $in: historyIds } },
        }),
      ]);
  
      const totalPages = Math.ceil(total / pageSize);
  
      // Map the article data to the response format
      const history = articles.map((article) => ({
        id: article.id,
        title: article.title,
        description: article.description,
        slug: article.slug,
        createdAt: article.createdAt,
        newslink: article.newslink,
        cover: article['cover'],
        category: article['category'],
      }));
  
      return ctx.send({
        message: 'Successfully retrieved history',
        history ,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      });
    } catch (error) {
      return ctx.throw(500, `Error fetching reading history: ${error.message}`);
    }
  }
  
}));
