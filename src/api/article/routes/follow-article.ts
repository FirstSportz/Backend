export default {
    routes: [
      {
        method: 'POST',
        path: '/articles/addbookmark',
        handler: 'article.addbookmark',
        config: {
          policies: [], // Apply any policies if needed, like authentication
        },
      },
      {
        method: 'POST',
        path: '/articles/removebookmark',
        handler: 'article.removebookmark',
        config: {
          policies: [], // Apply any policies if needed
        },
      },
      {
        method: 'GET',
        path: '/articles/bookmarkslist',
        handler: 'article.fetchBookmarks',
        config: {
          policies: [], // Apply any policies if needed
        },
      },
    ],
  };
  