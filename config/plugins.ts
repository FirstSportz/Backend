export default ({ strapi }) => ({
    // Extend the users-permissions plugin configuration
    'users-permissions': {
      config: {
        register: {
          allowedFields: ['phoneNumber', 'avatar', 'categories'],
        },
      },
    },
  
    // Extending the findOne method to populate categories
    bootstrap() {
      const extensionService = strapi.plugin('users-permissions').service('user');
  
      const originalFindOne = extensionService.findOne;
  
      extensionService.findOne = async (id, params) => {
        // Initialize params if it's undefined
        params = params || {};
  
        // Ensure categories are populated when fetching user data
        if (!params.populate) {
          params.populate = [];
        }
  
        // Add categories to the populate array
        params.populate.push('categories');
  
        // Call the original findOne method with the modified params
        return originalFindOne.call(extensionService, id, params);
      };
    },
  });
  