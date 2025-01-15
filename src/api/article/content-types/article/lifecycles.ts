import sendNotificationService from '../../../notification/services/notification';

export default {
  async afterUpdate({ result }) {
    // Trigger notification only if published
      const { title, description, id: newsId } = result;
      strapi.log.info(`afterUpdate:`,result);
      try {
        await strapi.services['api::notification.notification'].sendNotificationsToUsers({
          title: `New Article: ${title}`,
          message: description || 'Check out the latest news update!',
          newsId,
        });

        strapi.log.info(`Notifications triggered for article: ${title}`);
      } catch (error) {
        strapi.log.error(`Error triggering notifications for article ${newsId}: ${error.message}`);
      }
    
  },
};
