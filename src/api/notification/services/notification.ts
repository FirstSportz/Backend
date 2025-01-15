import { factories } from '@strapi/strapi';
import messaging from "../../../../config/fcm-config";


// Create the notification service
export default factories.createCoreService('api::notification.notification', ({ strapi }) => ({
  
    async sendNotificationsToUsers({ title, message, newsId }: { title: string; message: string; newsId: number }) {
        const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
          fields: ['id', 'notificationHistory', 'deviceToken'],
          filters: { deviceToken: { $notNull: true } },
        });
    
        const notificationData = {
          title,
          message,
          newsId,
          timestamp: new Date().toISOString(), // Convert Date to string
          read: false,
        };
    
              // Create entry in the Notification component
              await strapi.entityService.create('api::notification.notification', {
                data: {
                  title,
                  message,
                  timestamp: notificationData.timestamp,
                  news:newsId
                },
              });

        await Promise.all(
          users.map(async (user) => {
            try {
              // Send notification via Firebase
              await messaging.send({
                token: user.deviceToken,
                notification: {
                  title,
                  body: message,
                },
                data: { newsId: String(newsId) },
              });
    
              // Ensure notificationHistory is an array
              const updatedHistory = Array.isArray(user.notificationHistory) ? user.notificationHistory : [];
    
              updatedHistory.push(notificationData);
    
              await strapi.entityService.update('plugin::users-permissions.user', user.id, {
                data: { notificationHistory: updatedHistory },
              });
    

         
              strapi.log.info(`Notification sent and recorded for user ${user.id}`);
            } catch (error) {
              strapi.log.error(`Error sending notification to user ${user.id}: ${error.message}`);
            }
          })
        );
      },
}));
