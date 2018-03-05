const NodeCache = require('node-cache')
const axios = require('axios')

const mapLatLong = require('zwift-mobile-api/src/mapLatLong');
const { checkVisited } = require('zwift-second-screen/server/pointsOfInterest');
const Events = require('zwift-second-screen/server/events');

const Store = require('./store');

const poiCache = new NodeCache({ stdTTL: 30 * 60, checkPeriod: 120, useClones: false });

const playerCacheTimeout = 600 * 60;
const playerCache = new NodeCache({ stdTTL: playerCacheTimeout, checkPeriod: 120, useClones: false });

const rotations = {
  1: 90,
  2: 90,
  3: 0
}
const world_names = {
  1: 'Watopia',
  2: 'Richmond',
  3: 'London'
};

const WAYPOINTS_URL = process.env.ZwiftQuestWaypoints
    || 'http://zwiftquest.com/wp-content/uploads/2018/02/waypoints.txt';
const EVENT_NAME = 'zwiftquest';

const credit = () => ({ prompt: 'Event details at', name: 'ZwiftQuest', href: 'http://zwiftquest.com/' });

const STORE_KEYS = {
  STATE: 'ZwiftQuest-State'
}

class ZwiftQuest {
  constructor(worldId) {
    this.store = new Store();
    this.worldId = worldId;
    this.anonRider = null;
    this.globalMessage = null;
    this.events = null;
    this.eventIsPending = false;

    this.lastRequestDate = null;
    this.lastPollDate = null;
  }

  initialiseRiderProvider(riderProvider) {
    try {
      if (!this.anonRider && riderProvider.loginAnonymous) {
        const result = riderProvider.loginAnonymous();
        this.anonRider = riderProvider.getAnonymous(result.cookie);
        this.anonRider.setFilter(`event:${EVENT_NAME}`);
      }

      if (riderProvider.account) {
        this.events = new Events(riderProvider.account);
      }
    } catch (ex) {
      console.log(`ZwiftQuest: Exception initialising provider - ${errorMessage(ex)}`);
    }
  }

  get() {
    this.lastRequestDate = new Date();
    return this.checkRestoreGameState().then(() =>
      this.getWaypoints().then(points => {
        this.triggerGameState();
        return points;
      })
    );
  }

  infoPanel() {
    const scores = playerCache.keys()
        .map(key => playerCache.get(key))
        .filter(player => player.hasStarted())
        .map(player => ({
          rider: { id: player.id, firstName: player.firstName, lastName: player.lastName },
          score: player.getScore(),
          lastScore: player.lastScore
        }));
    scores.sort((a, b) => {
      const result = b.score - a.score;
      if (result === 0) {
        return a.lastScore - b.lastScore;
      }
      return result;
    });

    const messages = this.globalMessage ? {
      type: 'banner',
      list: [
        { text: this.globalMessage }
      ]
    } : null;

    return {
      details: credit(),
      scores: scores.length > 0 ? scores : null,
      showWaypoints: scores.length === 0,
      messages
    };
  }

  credit() {
    return { prompt: 'Event details at', name: 'ZwiftQuest', href: 'http://zwiftquest.com/' };
  }

  getWaypoints() {
    const cacheId = `zwiftquest-${this.worldId}`;
    const cachedPoints = poiCache.get(cacheId);

    if (cachedPoints) {
      return Promise.resolve(cachedPoints);
    } else {
      return this.getFromZwiftQuest().then(points => {
        poiCache.set(cacheId, points);
        return points;
      }).catch(function (ex) {
        console.log(`ZwiftQuest: Error getting ZwiftQuest waypoints - ${errorMessage(ex)}`);
      });
    }
  }

  getFromZwiftQuest() {
    return this.downloadQuest().then(waypointData => {
      const quest = (waypointData.worlds && waypointData.worlds[this.worldId])
          ? waypointData.worlds[this.worldId]
          : waypointData;

      if (quest.waypoints && (!quest.worldId || this.worldId === quest.worldId)) {
        this.globalMessage = null;
        const points = [
          this.toPoint(quest.start, { image: 'zq_start', role: 'start' })
        ];
        quest.waypoints.forEach(waypoint => {
          points.push(this.toPoint(waypoint, { image: 'zq_waypoint' }));
        })

        points.push(this.toPoint(quest.finish, { image: 'zq_finish', role: 'finish' }));
        return points;
      }

      if (quest.worldId) {
        this.globalMessage = `ZwiftQuest is currently in ${world_names[quest.worldId]}`;
      } else {
        this.globalMessage = `ZwiftQuest is not currently in ${world_names[this.worldId]}`;
      }
      return [];
    })
  }

  toPoint(waypoint, props) {
    const mapDef = mapLatLong[this.worldId];
    const xy = mapDef.toXY(waypoint.lat + mapDef.offset.lat, waypoint.long + mapDef.offset.long);
    return Object.assign({
      name: waypoint.name,
      x: xy.x,
      y: xy.y,
      rotate: rotations[this.worldId],
      size: 1.8
    }, props);
  }

  downloadQuest() {
    return new Promise(resolve => {
      axios.get(WAYPOINTS_URL)
      .then(response => {
        resolve(response.data);
      }).catch(function (error) {
        console.log(error);
        resolve({});
      });
    })
  }

  triggerGameState() {
    if (!this.anonRider) return;

    if (!this.lastPollDate || (new Date() - this.lastPollDate) > 10000) {
      this.updateState();
    }
  }

  updateState() {
    this.lastPollDate = new Date();
    return this.getWaypoints().then(points => {
      this.checkPendingEvent();

      this.anonRider.getPositions().then(positions => {
        let scoreChanged = false;
        positions.forEach(position => {
          const cacheId = `world-${this.worldId}-player-${position.id}`;
          let player = playerCache.get(cacheId);
          if (!player) {
            player = new Player(position);
            playerCache.set(cacheId, player);
          } else {
            playerCache.ttl(cacheId, playerCacheTimeout);
          }

          player.refreshWaypoints(points);
          if (!this.eventIsPending) {
            if (player.updatePosition(position)) {
              scoreChanged = true;
            }
          }
        });

        if (scoreChanged) {
          this.triggerStoreGameState();
        }

        if (this.lastRequestDate && (new Date() - this.lastRequestDate) < 1 * 60000) {
          // Keeps going for 10 minutes
          setTimeout(() => this.updateState(), 2500);
        }
      }).catch(function (ex) {
        console.log(`ZwiftQuest: Error getting updating rider positions - ${errorMessage(ex)}`);
      });
    });
  }

  checkRestoreGameState() {
    if (!this.lastPollDate) {
      if (!this.restorePromise) {
        this.restorePromise = this.store.get(STORE_KEYS.STATE).then(state => {
          const stateDate = (state && state.date) ? new Date(Date.parse(state.date)) : null;
          // Within the last hour
          if (stateDate && state.players && (new Date() - stateDate < 60 * 60 * 1000)) {
            state.players.forEach(stored => {
              const player = new Player(stored.rider);
              player.waypoints = stored.waypoints;
              player.lastScore = stored.lastScore;

              const cacheId = `world-${this.worldId}-player-${stored.rider.id}`;
              playerCache.set(cacheId, player);
            });
            console.log(`ZwiftQuest: Restored scores after reset`);
          } else {
            console.log(`ZwiftQuest: Reset scores after reset`);
          }

          this.restorePromise = null;
        }).catch(ex => {
          console.log(`ZwiftQuest: Error restoring scores after reset - ${errorMessage(ex)}`);
          this.restorePromise = null;
        });
      }

      return this.restorePromise;
    }
    return Promise.resolve();
  }

  triggerStoreGameState() {
    if (!this.storeTimer) {
      this.storeTimer = setTimeout(() => {
        // Persist player info
        const players = playerCache.keys()
          .map(key => playerCache.get(key))
          .filter(player => player.hasStarted())
          .map(player => ({
            rider: { id: player.id, firstName: player.firstName, lastName: player.lastName },
            waypoints: player.waypoints,
            lastScore: player.lastScore
          }));

        const state = {
          players,
          date: new Date()
        };

        this.store.set(STORE_KEYS.STATE, this.waypoints);

        this.storeTimer = null;
      }, 10000);
    }
  }

  checkPendingEvent() {
    if (this.events) {
      this.events.findMatchingEvent(EVENT_NAME).then(event => {
        const timeNow = new Date();
        if (event && event.eventStart) {
          const startTime = new Date(Date.parse(event.eventStart));
          const warmupTime = new Date(startTime.getTime() - 10*60000);

          this.eventIsPending = false;
          if (warmupTime < timeNow && timeNow < startTime) {
            this.eventIsPending = true;
            this.resetScores();
          }
        } else {
          this.eventIsPending = false;
        }
      }).catch(function (ex) {
        console.log(`ZwiftQuest: Error checking for ZwiftQuest events - ${errorMessage(ex)}`);
      });
    }
  }

  resetScores() {
    playerCache.keys()
      .map(key => playerCache.get(key))
      .forEach(player => player.resetScore());
  }
}
ZwiftQuest.credit = credit;

class Player {
  constructor(player) {
    this.id = player.id;
    this.firstName = player.firstName;
    this.lastName = player.lastName;
    this.positions = [];
    this.waypoints = [];
    this.lastScore = new Date();
  }

  updatePosition(position) {
    let scored = false;
    if (this.positions.length === 0
        || this.positions[this.positions.length - 1].x != position.x
        || this.positions[this.positions.length - 1].y != position.y ) {
      // Check the waypoints
      this.waypoints.forEach(point => {
        if (this.waypointEnabled(point) && !point.visited) {
          const pointVisited = checkVisited(position, this.positions, point);
          if (pointVisited && pointVisited.visited) {
            point.visited = true;
            this.lastScore = pointVisited.time;
            scored = true;
          }
        }
      });

      this.positions.push(position);
      if (this.positions.length > 3) {
        this.positions.splice(0, 1);
      }
    }
    return scored;
  }

  waypointEnabled(point) {
    switch(point.role) {
      case 'start':
        return true;
      case 'finish':
        return !this.waypoints.find(p => !p.role && !p.visited)
      default:
        return !this.waypoints.find(p => p.role === 'start' && !p.visited)
    }
  }

  refreshWaypoints(waypoints) {
    const existingWaypoints = this.waypoints;
    this.waypoints = waypoints.map(waypoint => {
      const existing = existingWaypoints.find(w => w.x == waypoint.x && w.y == waypoint.y && (!w.role || w.role == waypoint.role));
      return Object.assign({ visited: existing ? existing.visited : false }, waypoint);
    });
  }

  resetScore() {
    this.waypoints.forEach(w => {
      w.visited = false;
    });
  }

  hasStarted() {
    return !!this.waypoints.find(w => w.visited);
  }

  getScore() {
    return this.waypoints.reduce((score, waypoint) => {
      return score + ((waypoint.role !== 'start' && waypoint.visited) ? 1 : 0);
    }, 0);
  }
}

function errorMessage(ex) {
  return (ex && ex.response && ex.response.status)
      ? `- ${ex.response.status} (${ex.response.statusText})`
      : ex.message;
}

module.exports = ZwiftQuest;
