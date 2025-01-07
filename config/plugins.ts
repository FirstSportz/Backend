export default ({ env }) => ({
    // Extend the users-permissions plugin configuration
    'users-permissions': {
      config: {
        register: {
          allowedFields: ['phoneNumber', 'avatar', 'categories',"deviceToken","deviceOS","recentsearch"],
        },
      },
    },
  
    email: {
        config: {
          provider: 'strapi-provider-email-brevo',
          providerOptions: {
            apiKey: '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',
          },
          settings: {
            defaultFrom: 'aditya.mahajan@firstsportz.com',
            defaultSenderName: 'FirstSportz',
            defaultReplyTo: 'aditya.mahajan@firstsportz.com',
          },
        },
      },
  });
  