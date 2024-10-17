export default {
    routes: [
      {
        method: 'POST',
        path: '/auth/forgot-password',
        handler: 'auth.sendResetPasswordEmail',
        config: {
          policies: [],
          middlewares: [],
        },
      },
      {
        method: 'POST',
        path: '/auth/reset-password',
        handler: 'auth.resetPassword',
        config: {
          policies: [],
          middlewares: [],
        },
      },
    ],
  };
  