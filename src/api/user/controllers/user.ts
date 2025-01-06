import { factories } from '@strapi/strapi';
import { Context } from 'koa';

interface UserWithAvatar {
    id: number;
    avatar?: {
      id: number;
      url: string;
    };
  }

export default factories.createCoreController('plugin::users-permissions.user', ({ strapi }) => ({
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

}));
