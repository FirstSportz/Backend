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
      {
        method: 'POST',
        path: '/articles/search',
        handler: 'article.search',
        config: {
          policies: [],
        },
      },
      {
        method: 'GET',
        path: '/articles/fetchhistory',
        handler: 'article.fetchReadingHistory',
        config: {
          policies: [],
        },
      },
      {
        method: 'POST',
        path: '/articles/addToHistory',
        handler: 'article.addToHistory',
        config: {
          policies: [],
        },
      },
    ],
  };
  
