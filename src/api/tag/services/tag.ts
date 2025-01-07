/**
 * tag service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::tag.tag', ({ strapi }) => ({
  // Fetch popular tags sorted by usage_count
  async getPopularTags(limit = 6) {
    try {
      // Fetch all articles with their tags populated
      const articles = await strapi.entityService.findMany('api::article.article', {
        populate: ['tags'], // Ensure tags are populated
      });

      // Define the structure for type assertion
      type Tag = { id: number; tag: string }; // Assuming `tag` is the field for the tag's name
      type Article = { id: number; tags?: Tag[] };

      // Safely cast articles to the custom type
      const articleData = articles as unknown as Article[];

      // Count tag occurrences
      const tagCounts: Record<number, { id: number; name: string; count: number }> = {};

      articleData.forEach((article) => {
        if (article.tags) {
          article.tags.forEach((tag) => {
            if (tagCounts[tag.id]) {
              tagCounts[tag.id].count += 1;
            } else {
              tagCounts[tag.id] = { id: tag.id, name: tag.tag, count: 1 }; // Use `tag.tag` for the name
            }
          });
        }
      });

      // Sort and limit tags
      const sortedTags = Object.values(tagCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      return sortedTags;
    } catch (error) {
      strapi.log.error('Error fetching popular tags:', error);
      throw new Error('Failed to fetch popular tags');
    }
  },
}));
