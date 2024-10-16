export default ({ env }) => ({
    // Extend the users-permissions plugin configuration
    'users-permissions': {
      config: {
        register: {
          allowedFields: ['phoneNumber', 'avatar', 'categories'],
        },
      },
    },
  
    email: {
        config: {
          provider: 'strapi-provider-email-brevo',
          providerOptions: {
            apiKey: env('BREVO_API_KEY'),
          },
          settings: {
            defaultFrom: 'aditya.mahajan@firstsportz.com',
            defaultSenderName: 'FirstSportz',
            defaultReplyTo: 'aditya.mahajan@firstsportz.com',
          },
        },
      },
  });
  