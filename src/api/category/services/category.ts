/**
 * category service.
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::category.category', ({ strapi }) => ({
  
    async searchCategories(query: string, articles: any[]) {
        try {
          // First, search for categories by name matching the query
          const categories = await strapi.entityService.findMany('api::category.category', {
            filters: {
              name: { $containsi: query },
            },
          });
    
          // If no categories are found, but there are articles, check the articles' associated categories
          if (categories.length === 0 && articles.length > 0) {
            const categoryNamesFromArticles = articles.map((article) => article.category?.name).filter(Boolean);
            
            // Fetch categories related to the articles' categories
            const relatedCategories = await strapi.entityService.findMany('api::category.category', {
              filters: {
                name: { $in: categoryNamesFromArticles },
              },
            });
    
            // Combine found categories and related ones (if any)
            categories.push(...relatedCategories);
          }
    
          // Map and return category data for "Events"
          return categories.map((category) => ({
            id: category.id,
            name: category.name,
          }));
        } catch (error) {
          strapi.log.error(`Error fetching categories: ${error.message}`);
          throw new Error(`Unable to fetch categories`);
        }
      }
      

}));
