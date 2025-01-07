import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::article.article', ({ strapi }) => ({
 
  // Follow an article
  async followArticle(ctx) {
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
  async unfollowArticle(ctx) {
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

  async find(ctx) {
    const { query } = ctx;
  
    try {
      // Fetch articles
      const articles = await strapi.entityService.findMany('api::article.article', {
        ...query,
        populate: '*',
      });
  
      // Fetch recent searches
      const userId = ctx.state.user?.id;
      
  
      const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId); 

      const recentSearch = user.recentsearch; 
        
      // Fetch global popular tags
      const popularTags = await strapi.services['api::tag.tag'].getPopularTags();
  
      return ctx.send({
        articles,
        recentSearch,
        popularTags,
      });
    } catch (error) {
      return ctx.throw(500, `Error fetching data: ${error.message}`);
    }
  },
  
}));
