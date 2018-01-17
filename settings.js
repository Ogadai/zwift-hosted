module.exports = {
  worlds: {
    1: {
      map: '/maps/zwiftquest.png',
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
      12109030,12128029,11596903,11596925,14270131,12109305,12109228,12118362,13238028,12128037,14127077,12381109,12136784,14594245,12109117,12118421,12128016,12118550,12118555,12118544,12118314,14032406,14032381,14032426,14032442,14120237,14120182,16359363,16359371, // Watopia
      12128826,12128917,12128762,12128880,12128718,11307826,11307809,11308213, // Richmond
      12744502,12744396,12749377,12749402,12749649,12787306,12744360,12749761,12787386,12747814,12749353,12787306 // London
    ]
  }
};
