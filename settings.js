module.exports = {
  worlds: {
    1: {
      map: '/maps/watopia.png',
      background: '#0886E4',
      viewBox: '-625000 -395000 847000 847000',
      credit: { prompt: 'Powered by', name: 'ZwiftBlog', href: 'http://zwiftblog.com/' }
    },
    2: {
      map: '/maps/richmond.png',
      background: '#B9B9B9',
      viewBox: '-445000 -480000 847000 847000',
      credit: { prompt: 'Powered by', name: 'ZwiftBlog', href: 'http://zwiftblog.com/' }
    },
    3: {
      map: '/maps/london.png',
      background: '#7C9938',
      viewBox: '-67500 -383000 847000 847000',
      credit: { prompt: 'Powered by', name: 'ZwiftBlog', href: 'http://zwiftblog.com/' }
    },
    events: {
      zwiftquest: {
        1: {
          map: '/maps/zwiftquest/watopia.png',
          credit: { prompt: 'Event details at', name: 'ZwiftQuest', href: 'http://zwiftquest.com/' }
        },
        3: {
          map: '/maps/zwiftquest/london.png',
          credit: { prompt: 'Event details at', name: 'ZwiftQuest', href: 'http://zwiftquest.com/' }
        }
      }
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
    // http://zwiftblog.com/verified-zwift-strava-segments/
    segments: [
      12109030,12128029,16784833,16784850,14270131,12109305,12109228,
      12118362,13238028,12128037,14127077,12381109,12136784,14594245, // Watopia
      12109117,12118421,12128016,16402650,16359363,16359371,14032406,
      14032426,16425130,14120182, // Watopia
      12128826,12128917,12128762,12128880,12128718,11307826,11307809,11308213, // Richmond
      12744502,16802545,16781411,16781407,12749377,12749402,12749649,12744360, // London
    ]
  }
};
