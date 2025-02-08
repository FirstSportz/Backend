import { factories } from '@strapi/strapi';
import { Context } from 'koa';
import jwt from "jsonwebtoken";
import axios from "axios";

interface UserWithAvatar {
    id: number;
    avatar?: {
      id: number;
      url: string;
    };
  }

export default factories.createCoreController('plugin::users-permissions.user', ({ strapi }) => ({
  
  async googleSignIn(ctx) {
    const { idToken } = ctx.request.body;

    if (!idToken) {
      return ctx.throw(400, "Google ID token is required.");
    }

    try {
      // Verify token with Google
      const googleResponse = await axios.get(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`
      );

      const { email, name, picture, sub } = googleResponse.data;

       // Fetch the default "Authenticated" role ID
       const authenticatedRole = await strapi.query("plugin::users-permissions.role").findOne({
        where: { type: "authenticated" },
      });

      if (!authenticatedRole) {
        return ctx.throw(500, "Authenticated role not found.");
      }

      // Check if user already exists
      let user = await strapi.query("plugin::users-permissions.user").findOne({
        where: { email },
      });

      if (!user) {
        // Create new user
        user = await strapi.query("plugin::users-permissions.user").create({
          data: {
            username: name,
            email,
            provider: "google",
            confirmed: true,
            blocked: false,
            isGoogleSignIn: true,
            profilePicture: picture,
            role: authenticatedRole.id, // Assign the role
            googleId: sub, // Store Google unique ID
          },
        });
      }

      // Generate JWT Token
      const jwtToken = jwt.sign(
        { id: user.id },
        strapi.config.get("plugin.users-permissions.jwtSecret"),
        { expiresIn: "7d" }
      );

      // Send response
      return ctx.send({
        jwt: jwtToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          provider: user.provider,
          confirmed: user.confirmed,
          blocked: user.blocked,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          phoneNumber: user.phoneNumber || null,
          deviceToken: user.deviceToken || null,
          deviceOS: user.deviceOS || null,
          recentsearch: user.recentsearch || [],
          notificationHistory: user.notificationHistory || null,
          isGoogleSignIn: user.isGoogleSignIn || false,
          profilePicture: picture || null,
        },
      });
    } catch (error) {
      console.error("Google Sign-In Error:", error.message);
      return ctx.throw(401, "Invalid Google authentication.");
    }
  },
  
  /**
   * Add categories to a user
   * @param ctx - The request context
   */
  async addCategoriesToUser(ctx) {
    const userId = ctx.state.user.id; // Retrieve the logged-in user's ID
    const { categoryIds } = ctx.request.body; // Array of category IDs to add

    if (!categoryIds || !Array.isArray(categoryIds)) {
      return ctx.throw(400, 'Category IDs must be provided as an array');
    }

    try {
      // Update the user's categories by adding the new category IDs
      const userAddCategory = await strapi.plugins['users-permissions'].services.user.edit(userId, {
        categories: [...(ctx.state.user.categories || []), ...categoryIds],
      });

      const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
        populate: ['categories'],
      });

      return ctx.send({ message: 'Categories added successfully', user });
    } catch (error) {
      return ctx.throw(500, `Error adding categories: ${error.message}`);
    }
  },

  /**
   * Update categories for a user (replaces existing categories with provided ones)
   * @param ctx - The request context
   */
  async updateCategoriesForUser(ctx) {
    const userId = ctx.state.user.id; // Retrieve the logged-in user's ID
    const { categoryIds } = ctx.request.body; // Array of category IDs to set

    if (!categoryIds || !Array.isArray(categoryIds)) {
      return ctx.throw(400, 'Category IDs must be provided as an array');
    }

    try {
      // Replace the user's categories with the new category IDs
      const userUpdateCategory = await strapi.plugins['users-permissions'].services.user.edit(userId, {
        categories: categoryIds,
      });

      const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
        populate: ['categories'],
      });

      return ctx.send({ message: 'Categories updated successfully', user });
    } catch (error) {
      return ctx.throw(500, `Error updating categories: ${error.message}`);
    }
  },

  async uploadAvatar(ctx) {
    const userId = ctx.state.user?.id; // The ID of the logged-in user

    if (!userId) {
      return ctx.throw(401, 'Unauthorized');
    }

    // Check if a file is uploaded
    const { files } = ctx.request.files || {};
    if (!files || Array.isArray(files)) {
      return ctx.throw(400, 'Please upload a single file.');
    }

    try {
      // Upload the file
      const uploadedFile = await strapi.plugins.upload.services.upload.upload({
        data: {}, // Additional data (optional)
        files: files,
      });

      if (!uploadedFile || uploadedFile.length === 0) {
        return ctx.throw(500, 'File upload failed');
      }

      // Get the uploaded file ID
      const avatarId = uploadedFile[0].id;

      // Update the user with the avatar file
      const updatedUser = await strapi.entityService.update('plugin::users-permissions.user', userId, {
        data: { avatar: avatarId },
        populate: ['avatar'],
      });

      return ctx.send({
        message: 'Avatar uploaded and linked successfully',
        user: updatedUser,
      });
    } catch (error) {
      return ctx.throw(500, `Error uploading avatar: ${error.message}`);
    }
  },

  async deleteAvatar(ctx) {
    const userId = ctx.state.user.id; // Get the authenticated user's ID

    // Fetch the user with the `avatar` field populated
    const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
      populate: { avatar: true },
    }) as UserWithAvatar; // Type assertion to our custom type

    if (!user || !user.avatar) {
      return ctx.badRequest('No profile image found for this user.');
    }

    try {
      // Step 1: Get the ID of the file in the Upload library
      const fileId = user.avatar.id;

      // Step 2: Remove the avatar field from the user's profile
      await strapi.entityService.update('plugin::users-permissions.user', userId, {
        data: {
          avatar: null,
        },
      });

      // Step 3: Delete the file from the Upload library
      await strapi.plugins['upload'].services.upload.remove({ id: fileId });

      return ctx.send({
        message: 'Profile image deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting avatar:', error);
      return ctx.internalServerError('Failed to delete profile image');
    }
  },

  async updateReadStatus(ctx) {
    try {
      const { newsId } = ctx.request.body;
      const userId = ctx.state.user.id; // Get the authenticated user's ID

      if (!userId || !newsId) {
        return ctx.badRequest('User ID and News ID are required.');
      }

      // Fetch user notification history
      const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
        fields: ['notificationHistory'],
      });

      let notificationHistory = Array.isArray(user.notificationHistory) ? user.notificationHistory : [];

      // Update read status
      notificationHistory = notificationHistory.map(notification => {
        if (typeof notification === 'object' && notification['newsId'] === newsId) {
          return { ...notification, read: true };
        }
        return notification;
      });

      // Save updated notification history
      await strapi.entityService.update('plugin::users-permissions.user', userId, {
        data: { notificationHistory },
      });

      ctx.send({ message: 'Read status updated successfully.' });
    } catch (error) {
      strapi.log.error(`Error updating read status: ${error.message}`);
      ctx.internalServerError('Failed to update read status.');
    }
  },

  async listNotifications(ctx) {
    try {
      const userId = ctx.state.user.id; // Get the authenticated user's ID
  
      if (!userId) {
        return ctx.badRequest('User ID is required.');
      }
  
      // Pagination parameters
      const query = ctx.query as Record<string, any>;
      const page = parseInt(query.page || '1', 10); // Default to page 1
      const pageSize = parseInt(query.pageSize || '10', 10); // Default page size is 10
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      
  
      // Fetch user notification history
      const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
        fields: ['notificationHistory'],
      });
  
      const notifications = Array.isArray(user.notificationHistory)
        ? user.notificationHistory.sort((a, b) => new Date(b['timestamp']).getTime() - new Date(a['timestamp']).getTime())
        : [];
  
      // Slice notifications for the current page
      const paginatedNotifications = notifications.slice(startIndex, endIndex);
  
      // Fetch related article data for each notification
      const enhancedNotifications = await Promise.all(
        paginatedNotifications.map(async (notification) => {
          const article = await strapi.entityService.findOne('api::article.article', notification['newsId'], {
            fields: ['title', 'description', 'createdAt','newslink'], // Select desired fields
            populate: '*', // Populate category if needed
          });
  
          return {
            title: notification['title']||null,
            message: notification['message']||null,
            newsId: notification['newsId']||null,
            timestamp: new Date(notification['timestamp']).toISOString(), // Convert to ISO string
            read: notification['read'],
            newslink: article['newslink']||null,
            cover: article["cover"] || null, // Handle case where cover or article may be missing
          };
        })
      );
  
      // Total count for pagination
      const total = notifications.length;
      const totalPages = Math.ceil(total / pageSize);
  
      ctx.send({
        message: 'Successfully retrieved notifications',
        notifications: enhancedNotifications,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      });
    } catch (error) {
      strapi.log.error(`Error fetching notifications: ${error.message}`);
      ctx.internalServerError('Failed to fetch notifications.');
    }
  },    

}));
