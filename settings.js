﻿module.exports = {
  worlds: {
    1: {
      map: '/maps/watopia.png',
      viewBox: '-551868 -323969 599071 900906',
      credit: { prompt: 'Powered by', name: 'ZwiftBlog', href: 'http://zwiftblog.com/' }
    },
    2: {
      map: '/maps/richmond.jpg',
      viewBox: '-283211 -289039 691768 462822',
      credit: { prompt: 'Powered by', name: 'ZwiftBlog', href: 'http://zwiftblog.com/' }
    },
    3: {
      map: '/maps/london.gif',
      viewBox: '114132 -204219 668391 444149',
      credit: { prompt: 'Powered by', name: 'ZwiftBlog', href: 'http://zwiftblog.com/' }
    }
  },
  site: {
    cookieWarning: true,
    title: 'ZwiftGPS',
    static: {
      route: '/maps',
      path: `${__dirname}/maps`
    }
  }
};
