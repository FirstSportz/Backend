import sendNotificationService from '../../../notification/services/notification';

export default {
  async afterUpdate({ result }) {
    try {
      // Fetch the updated article with populated category
      const article = await strapi.entityService.findOne('api::article.article', result.id, {
        populate:  "*", // Ensure the category is populated
      });

      const { title, description, id: newsId } = article;

      let category=article["category"]
      // Extract category name
      const categoryName = category?.name || 'General';

      // Log details for debugging
      strapi.log.info(`${categoryName} just posted - ${title}`);

      // Send notifications to users
      await strapi.services['api::notification.notification'].sendNotificationsToUsers({
        title: `${categoryName} just posted - ${title}`,
        message: description || 'Check out the latest news update!',
        newsId,
      });

      strapi.log.info(`Notifications triggered for article: ${title}`);
    } catch (error) {
      strapi.log.error(`Error triggering notifications for article ${result.id}: ${error.message}`);
    }
  },
};
