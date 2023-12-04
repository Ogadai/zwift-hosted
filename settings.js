const ZwiftQuest = require('./zwiftquest');
const GoldRush = require('./goldrush');

module.exports = {
    worlds: {
        1: {
            map: '/maps/watopia.jpg',
            roads: '/maps/watopia-roads.json',
            background: '#0886E4',
            viewBox: '-972000 -835500 1822300 1341400',
            rotate: "(-90,122141,234864)",
            translate: "(949427,295876)",
            credit: { prompt: 'Powered by', name: 'WTRL Racing', href: 'https://www.wtrl.racing' },
            points: {
                get: () => Promise.resolve([
                    { name: 'Start Banner', x: 107500, y: -10000, image: 'start', rotate: 170 },
                   /* { name: 'Hilly Fwd Start', x: 49683, y: 54712, image: 'climbstart', rotate: 60 },*/
                    { name: 'Hilly KOM', x: 49683, y: 54712, image: 'kom', rotate: 60 },
                    /*{ name: 'Hilly Rev Start', x: 49683, y: 54712, image: 'climbstart', rotate: 60 },*/
                    /*{ name: 'JWB Fwd Start', x: -24300, y: -40500, image: 'sprintstart', rotate: 60 },*/
                    { name: 'JWB Sprint', x: -24300, y: -40500, image: 'sprint', rotate: 60 },
                    /*{ name: 'JWB Rev Start', x: -24300, y: -40500, image: 'sprintstart', rotate: 60 },
                    { name: 'Epic Fwd Start', x: -361987, y: 86048, image: 'climbstart', rotate: 30 },*/
                    { name: 'Epic KOM', x: -361987, y: 86048, image: 'mountain', rotate: 30 },
                    { name: 'Jungle Start', x: -498690, y: -268679, image: 'start', rotate: 180 },
                    { name: 'Fuego Sprint', x: 62256, y: 321485, image: 'sprint', rotate: 170 },
                    /*{ name: 'Epic Rev Start', x: -361987, y: 86048, image: 'climbstart', rotate: 30 },
                    { name: 'Jungle Start', x: -499228, y: -263780, image: 'banner', rotate: 20 },
                    { name: 'Volcano Start', x: -209968.36, y: -55463.453, image: 'climbstart', rotate: 15 },
                    { name: 'Volcano KOM', x: 62256, y: 321485, image: 'mountian', rotate: 170 },
                    { name: 'Alpe de Zwift Start', x: -209968.36, y: -55463.453, image: 'climbstart', rotate: 15 },
                    { name: 'Alpe de Zwift', x: 62256, y: 321485, image: 'mountain', rotate: 170 },
                    { name: 'Stoneway Fwd Start', x: 62256, y: 321485, image: 'sprintstart', rotate: 170 },
                    { name: 'Stoneway Sprint', x: 62256, y: 321485, image: 'sprint', rotate: 170 },
                    { name: 'Stoneway Rev Start', x: 62256, y: 321485, image: 'sprintstart', rotate: 170 },
                    { name: 'Woodland Fwd Start', x: 62256, y: 321485, image: 'sprintstart', rotate: 170 },
                    { name: 'Woodland Sprint', x: 62256, y: 321485, image: 'sprint', rotate: 170 },
                    { name: 'Woodland Rev Start', x: 62256, y: 321485, image: 'sprintstart', rotate: 170 },
                    { name: 'Acropolis Fwd Start', x: -227425.2, y: 65148.137, image: 'sprintstart', rotate: 15 },*/
                    { name: 'Acropolis Sprint', x: -727499.1, y: 25671.162, image: 'sprint', rotate: 90 },
                    /*{ name: 'Acropolis Rev Start', x: -227425.2, y: 65148.137, image: 'sprintstart', rotate: 15 },
                    { name: 'Sasquatch Fwd Start', x: -227425.2, y: 65148.137, image: 'sprintstart', rotate: 15 },*/
                    { name: 'Sasquatch Sprint', x: -497821.88, y: 448120.25, image: 'sprint', rotate: 80 },
                    /*{ name: 'Sasquatch Rev Start', x: -227425.2, y: 65148.137, image: 'sprintstart', rotate: 15 },*/
                ])
            }
        },
        2: {
            map: '/maps/richmond.png',
            background: '#B9B9B9',
            viewBox: '-445000 -480000 847000 847000',
            rotate: "(-90,170389,190060)",
            translate: "(457062,36315)",
            credit: { prompt: 'Powered by', name: 'WTRL Racing', href: 'https://www.wtrl.racing' },
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
            credit: { prompt: 'Powered by', name: 'WTRL Racing', href: 'https://www.wtrl.racing' },
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
            map: '/maps/newyork.png',
            roads: '/maps/newyork-roads.json',
            background: '#B9B9B9',
            viewBox: '-388500 -554000 847000 847000',
            rotate: "(0,0,0)",
            translate: "(0,0)",
            credit: { prompt: 'Powered by', name: 'WTRL Racing', href: 'https://www.wtrl.racing' },
            points: {
                get: () => Promise.resolve([
                    { name: 'KOM', x: -19500, y: 20700, image: 'kom', rotate: -60 },
                    { name: 'Sprint Banner', x: -6000, y: -49500, image: 'sprint', rotate: 35 },
                    { name: 'Start Banner', x: 79500, y: -106000, image: 'start', rotate: 10 }
                ])
            }
        },
        5: {
            map: '/maps/innsbruck.png',
            roads: '/maps/innsbruck-roads.json',
            background: '#7C9938',
            viewBox: '-343000 -243000 991000 991000',
            rotate: "(0,0,0)",
            translate: "(0,0)",
            credit: { prompt: 'Powered by', name: 'WTRL Racing', href: 'https://www.wtrl.racing' },
            points: {
                get: () => Promise.resolve([
                    { name: 'KoM', x: 185000, y: 629900, image: 'kom', rotate: 15 },
                    { name: 'Sprint Banner', x: 33138, y: -71634, image: 'sprint', rotate: 50 },
                    { name: 'Start Banner', x: -3784, y: 34427, image: 'start', rotate: 5 }
                ])
            }
        },
        6: {
            map: '/maps/bologna.png',
            background: '#C5C5C5',
            viewBox: '-637200 -401400 847000 847000',
            rotate: "(0,0,0)",
            translate: "(0,0)",
            credit: { prompt: 'Powered by', name: 'WTRL Racing', href: 'https://www.wtrl.racing' },
            points: {
                get: () => Promise.resolve([
                ])
            }
        },
        7: {
            map: '/maps/yorkshire.png',
            roads: '/maps/yorkshire-roads.json',
            background: '#7C9938',
            viewBox: '-590000 -380000 847000 847000',
            rotate: "(0,0,0)",
            translate: "(0,0)",
            credit: { prompt: 'Powered by', name: 'WTRL Racing', href: 'https://www.wtrl.racing' },
            points: {
                get: () => Promise.resolve([
                ])
            }
        },
        8: {
            map: '/maps/critcity.png',
            background: '#C5C5C5',
            viewBox: '-206000 -208100 423500 423500',
            rotate: "(0,0,0)",
            translate: "(0,0)",
            credit: { prompt: 'Powered by', name: 'WTRL Racing', href: 'https://www.wtrl.racing' },
            points: {
                get: () => Promise.resolve([
                ])
            }
        },
        10: {
            map: '/maps/france.png',
            background: '#6E9A29',
            viewBox: '-678447 -610687 1270500 1270500',
            rotate: "(0,0,0)",
            translate: "(0,0)",
            credit: { prompt: 'Powered by', name: 'WTRL Racing', href: 'https://www.wtrl.racing' },
            points: {
                get: () => Promise.resolve([
                ])
            }
        },
        11: {
            map: '/maps/paris.png',
            background: '#C5C5C5',
            viewBox: '-423500 -423500 847000 847000',
            rotate: "(0,0,0)",
            translate: "(0,0)",
            credit: { prompt: 'Powered by', name: 'WTRL Racing', href: 'https://www.wtrl.racing' },
            points: {
                get: () => Promise.resolve([
                ])
            }
        },
        9: {
            map: '/maps/makuriislands.png',
            background: '#7B9937',
            viewBox: '-1135000 -772000 1220000 1220000',
            rotate: "(0,0,0)",
            translate: "(0,0)",
            credit: { prompt: 'Powered by', name: 'WTRL Racing', href: 'https://www.wtrl.racing' },
            points: {
                get: () => Promise.resolve([
                ])
            }
        },
        17: {
            map: '/maps/scotland.png',
            background: '#aba73c',
            viewBox: '-451000 -320000 639800 639800',
            rotate: "(0,0,0)",
            translate: "(0,0)",
            credit: { prompt: 'Powered by', name: 'WTRL Racing', href: 'https://www.wtrl.racing' },
            points: {
                get: () => Promise.resolve([
                    { name: 'Loch Loop Start/End', x: -189426.75, y: -65130.598, image: 'start', rotate: 270},
                    { name: 'Breakaway Brae Start', x: -40179.074, y: -2401.4595, image: 'climbstart', rotate: 15 },
                    { name: 'Breakaway Brae End', x: -4803.8457, y: -8944.207, image: 'kom', rotate: 35 },
                    { name: 'Breakaway Brae Reverse Start', x: -29500.102, y:-19239.773, image: 'climbstart', rotate: 15 },
                    { name: 'Champions Sprint Start', x: -227425.2, y: 65148.137, image: 'sprintstart', rotate: 15 },
                    { name: 'Champions Sprint End', x: -246526.45, y: 64931.418, image: 'sprint', rotate: 270 },
                    { name: 'Clyde Kicker Start', x: -204222.4, y: 53589.652, image: 'climbstart', rotate: 15 },
                    { name: 'Clyde Kicker End', x: -203452.44, y: 83174.91, image: 'kom', rotate: 0 },
                    { name: 'Clyde Kicker Reverse Start', x: -253522.94, y: 96473.945, image: 'climbstart', rotate: 15 },
                    { name: 'Sgurr Summit North Start', x: -175249.84, y: 32838.324, image: 'climbstart', rotate: 15 },
                    { name: 'Sgurr Summit End', x: -194222.1, y: -532.2133, image: 'kom', rotate: 15 },
                    { name: 'Sgurr Summit South Start', x: -209968.36, y: -55463.453, image: 'climbstart', rotate: 15 },
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
        },
        4: {
          points: (...params) => new GoldRush(4, ...params)
        },
        5: {
          points: (...params) => new GoldRush(5, ...params)
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
      19141090, 19141092, // New York
      18397965, 18397927, // Innsbruck
    ]
  }
};
