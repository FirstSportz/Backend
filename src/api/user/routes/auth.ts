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
    ],
  };
  