import { factories } from '@strapi/strapi';

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
}));
