/**
 * article router.
 */

import { factories } from '@strapi/strapi';

export default {
    routes: [
      {
        method: 'GET',
        path: '/articles/all-news',
        handler: 'article.fetchAllNews',
        config: {
          policies: [],
        },
      },
      {
        method: 'GET',
        path: '/articles/todays-news',
        handler: 'article.fetchTodaysNews',
        config: {
          policies: [],
        },
      },
    ],
  };
  
