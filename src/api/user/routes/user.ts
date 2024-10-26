export default {
    routes: [
      {
        method: 'POST',
        path: '/users/categories/add',
        handler: 'user.addCategoriesToUser',
        config: {
          policies: [],
        },
      },
      {
        method: 'PUT',
        path: '/users/categories/update',
        handler: 'user.updateCategoriesForUser',
        config: {
          policies: [],
        },
      },
    ],
  };
  

  