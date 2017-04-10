module.exports = {
  worlds: {
    1: {
      map: '/maps/watopia.png',
      background: '#DBEFFC',
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
    approvalRequired: {
      message: 'ZwiftGPS isn\'t able to track private accounts',
      alt: {
        message: 'As an alternative, please try ZwiftMap from',
        link: {
          caption: 'ZwiftHacks.com',
          addr: 'http://zwifthacks.com/zwiftmap-for-macos-is-here/'
        }
      }
    },
    static: {
      route: '/maps',
      path: `${__dirname}/maps`
    }
  },
  strava: {
    segments: [
      11596903,11596925,12109030,12109228,12109305,12118362,12128029,14032381,14032406,14120182,14270131,14032381,14032406,14120182,14270131, // Watopia
      11308213, // Richmond
      12744396,12744502,12747814,12749377,12749402,12749649,12806756 // London
    ]
  }
};
