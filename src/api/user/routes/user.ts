export default {
    routes: [
      {
        method: "POST",
        path: "/auth/google-signin",
        handler: "user.googleSignIn",
        config: {
          auth: false,
        },
      },
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
      {
        method: 'POST',
        path: '/users/upload-avatar',
        handler: 'user.uploadAvatar',
        config: {
          policies: [], // optional: if you want to restrict to authenticated users only
        },
      },

      {
        method: 'POST',
        path: '/users/delete-avatar',
        handler: 'user.deleteAvatar',
        config: {
          policies: [], // optional: if you want to restrict to authenticated users only
        },
      },

       {
        method: 'POST',
        path: '/users/update-read-status',
        handler: 'user.updateReadStatus',
        config: {
          policies: [],
          middlewares: [],
        },
      },

      {
        method: 'GET',
        path: '/users/notifications',
        handler: 'user.listNotifications',
        config: {
          policies: [],
          middlewares: [],
        },
      },
    ],
  };
  

  