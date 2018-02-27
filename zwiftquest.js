const NodeCache = require('node-cache')
const axios = require('axios')

const mapLatLong = require('zwift-mobile-api/src/mapLatLong');
const { checkVisited } = require('zwift-second-screen/server/pointsOfInterest');

const poiCache = new NodeCache({ stdTTL: 30 * 60, checkPeriod: 120, useClones: false });
const playerCache = new NodeCache({ stdTTL: 600 * 60, checkPeriod: 120, useClones: false });

const rotations = {
  1: 90,
  2: 90,
  3: 0
}

//const WAYPOINTS_URL = 'http://zwiftquest.com/wp-content/uploads/2018/02/waypoints.txt';
const WAYPOINTS_URL = 'https://drive.google.com/uc?id=1mEjLuwErn5DrjaIkhx13BVe2lC6j_iwv&authuser=0&export=download';

const credit = () => ({ prompt: 'Event details at', name: 'ZwiftQuest', href: 'http://zwiftquest.com/' });

class ZwiftQuest {
  constructor(worldId) {
    this.worldId = worldId;
    this.anonRider = null;

    this.lastPollDate = null;
  }

  initialiseRiderProvider(riderProvider) {
    if (!this.anonRider && riderProvider.loginAnonymous) {
      const result = riderProvider.loginAnonymous();
      this.anonRider = riderProvider.getAnonymous(result.cookie);
      this.anonRider.setFilter(`event:zwiftquest`);
    }
  }

  get() {
    const cacheId = `zwiftquest-${this.worldId}`;
    const cachedPoints = poiCache.get(cacheId);

    if (cachedPoints) {
      this.updateState(cachedPoints);
      return Promise.resolve(cachedPoints);
    } else {
      return this.getFromZwiftQuest().then(points => {
        poiCache.set(cacheId, points);
        this.updateState(points);
        return points;
      })
    }
  }

  infoPanel() {
    const scores = playerCache.keys()
        .map(key => playerCache.get(key))
        .map(player => ({
          rider: { id: player.id, firstName: player.firstName, lastName: player.lastName },
          score: player.getScore()
        }));
    scores.sort((a, b) => b.score - a.score);

    return {
      details: credit(),
      scores
    };
  }

  credit() {
    return { prompt: 'Event details at', name: 'ZwiftQuest', href: 'http://zwiftquest.com/' };
  }

  getFromZwiftQuest() {
    return this.downloadQuest().then(quest => {
      if (this.worldId === quest.worldId) {
        const points = [
          this.toPoint(quest.start, { image: 'zq_start', role: 'start' })
        ];
        quest.waypoints.forEach(waypoint => {
          points.push(this.toPoint(waypoint, { image: 'zq_waypoint' }));
        })

        points.push(this.toPoint(quest.finish, { image: 'zq_finish', role: 'finish' }));
        return points;
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

  updateState(points) {
    if (!this.anonRider) return;

    const currentDate = new Date();
    if (!this.lastPollDate || (currentDate - this.lastPollDate) > 2500) {
      this.anonRider.getPositions().then(positions => {
        positions.forEach(position => {
          const cacheId = `world-${this.worldId}-player-${position.id}`;
          let player = playerCache.get(cacheId);
          if (!player) {
            player = new Player(position);
            playerCache.set(cacheId, player);
          }
          player.refreshWaypoints(points);
          player.updatePosition(position);
        });
      });

      this.lastPollDate = currentDate;
    }
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
  }

  updatePosition(position) {
    if (this.positions.length === 0
        || this.positions[this.positions.length - 1].x != position.x
        || this.positions[this.positions.length - 1].y != position.y ) {
      // Check the waypoints
      this.waypoints.forEach(point => {
        if (this.waypointEnabled(point) && !point.visited) {
          const pointVisited = checkVisited(position, this.positions, point);
          point.visited = pointVisited && pointVisited.visited;
        }
      });

      this.positions.push(position);
      if (this.positions.length > 3) {
        this.positions.splice(0, 1);
      }
    }
  }

  waypointEnabled(point) {
    switch(point.role) {
      case 'start':
        return true;
      case 'finish':
        return !this.waypoints.find(p => p.role !== 'finish' && !p.visited)
      default:
        return true;
//        return !this.waypoints.find(p => p.role === 'start' && !p.visited)
    }
  }

  refreshWaypoints(waypoints) {
    const existingWaypoints = this.waypoints;
    this.waypoints = waypoints.map(waypoint => {
      const existing = existingWaypoints.find(w => w.x == waypoint.x && w.y == waypoint.y);
      return Object.assign({ visited: existing ? existing.visited : false }, waypoint);
    });
  }

  getScore() {
    return this.waypoints.reduce((score, waypoint) => {
      return score + waypoint.visited ? 1 : 0;
    }, 0);
  }
}

const distance = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

module.exports = ZwiftQuest;
