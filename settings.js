const ZwiftQuest = require('./zwiftquest');
const GoldRush = require('./goldrush');

module.exports = {
  worlds: {
    1: {
      map: '/maps/watopia.png',
      roads: '/maps/watopia-roads.json',
      background: '#0886E4',
      viewBox: '-641000 -801000 1270000 847000',
      rotate: "(-90,122141,234864)",
      translate: "(949427,295876)",
      credit: { prompt: 'Powered by', name: 'ZwiftBlog', href: 'http://zwiftblog.com/' },
      points: {
        get: () => Promise.resolve([
          { name: 'Start Banner', x: 104047, y: -10948, image: 'start', rotate: 180 },
          { name: 'Hilly KOM', x: 49683, y: 54712, image: 'kom', rotate: 60 },
          { name: 'Sprint', x: -25404, y: -40021, image: 'sprint', rotate: 60 },
          { name: 'Epic KOM', x: -361987, y: 86048, image: 'mountain', rotate: 30 },
          { name: 'Jungle Start', x: -499228, y: -263780, image: 'banner', rotate: 20 }
        ])
      }
    },
    2: {
      map: '/maps/richmond.png',
      background: '#B9B9B9',
      viewBox: '-445000 -480000 847000 847000',
      rotate: "(-90,170389,190060)",
      translate: "(457062,36315)",
      credit: { prompt: 'Powered by', name: 'ZwiftBlog', href: 'http://zwiftblog.com/' },
      points: {
        get: () => Promise.resolve([
          { name: 'Sprint Banner', x: 145912, y: -235695, image: 'sprint', rotate: 40 },
          { name: 'Start Banner', x: -8764, y: 12332, image: 'start', rotate: 40 }
        ])
      }
    },
    3: {
      map: '/maps/london.png',
      roads: '/maps/london-roads.json',
      background: '#7C9938',
      viewBox: '-67500 -383000 847000 847000',
      rotate: "(0,0,0)",
      translate: "(0,0)",
      credit: { prompt: 'Powered by', name: 'ZwiftBlog', href: 'http://zwiftblog.com/' },
      points: {
        get: () => Promise.resolve([
          { name: 'Box Hill', x: 474491, y: 138646, image: 'kom', rotate: 90 },
          { name: 'Keith Hill', x: 550217, y: 287329, image: 'kompink', rotate: 80 },
          { name: 'Sprint Banner', x: 230658, y: -28483, image: 'sprint', rotate: 55 },
          { name: 'Start Banner', x: 591009, y: -82260, image: 'start', rotate: -80 }
        ])
      }
    },
    4: {
      map: '/maps/innsbruck.png',
      background: '#7C9938',
      viewBox: '-74000 -308000 847000 847000',
      rotate: "(0,0,0)",
      translate: "(0,0)",
      credit: { prompt: 'Powered by', name: 'ZwiftBlog', href: 'http://zwiftblog.com/' },
      points: {
        get: () => Promise.resolve([
        ])
      }
    },
    events: {
      zwiftquest: {
        1: {
          map: '/maps/zwiftquest/watopia.png',
          credit: ZwiftQuest.credit(),
          points: new ZwiftQuest(1)
        },
        2: {
          map: '/maps/zwiftquest/richmond.png',
          credit: ZwiftQuest.credit(),
          points: new ZwiftQuest(2)
        },
        3: {
          map: '/maps/zwiftquest/london.png',
          credit: ZwiftQuest.credit(),
          points: new ZwiftQuest(3)
        }
      },
      goldrush: {
        1: {
          points: (...params) => new GoldRush(1, ...params)
        },
        2: {
          points: (...params) => new GoldRush(2, ...params)
        },
        3: {
          points: (...params) => new GoldRush(3, ...params)
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
    },
    offline: `${__dirname}/offline.html`
  },
  strava: {
    // http://zwiftblog.com/verified-zwift-strava-segments/
    segments: [
      12109030,12128029,16784833,16784850,14270131,12109305,12109228,
      12118362,12128037,12136784, // Watopia
      12109117,16359363,16359371,14032406,14120182,17264705, // Watopia
      12128826,12128917,12128762,12128880,12128718,11307826,11307809,11308213, // Richmond
      12744502,16802545,16781411,16781407,12749377,12749402,12749649,12744360, // London
    ]
  }
};
