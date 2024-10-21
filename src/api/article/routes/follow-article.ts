export default {
    routes: [
      {
        method: 'POST',
        path: '/articles/follow',
        handler: 'article.followArticle',
        config: {
          policies: [], // Apply any policies if needed, like authentication
        },
      },
      {
        method: 'POST',
        path: '/articles/unfollow',
        handler: 'article.unfollowArticle',
        config: {
          policies: [], // Apply any policies if needed
        },
      },
    ],
  };
  