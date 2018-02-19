const Map = require('zwift-second-screen/server/map');
const moment = require('moment');

const rotations = {
  1: 90,
  2: 90,
  3: 0
};

const counts = {
  1: 30,
  2: 10,
  3: 20
};

const distance = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

let coin_id = 1;

class GoldRush {
  constructor(worldId) {
    this.worldId = worldId;
    this.roadPoints = null;

    this.state = {};
    this.waypoints = [];
    this.scores = [];
  }

  get() {
    this.checkGameState();

    if (this.state.waiting) {
      return Promise.resolve([]);
    } else {
      return this.checkWaypoints();
    }
  }

  infoPanel() {
    const details = this.state.waiting
      ? { prompt: 'Next game starts', time: this.state.nextTime }
      : { prompt: 'Game ends', time: this.state.nextTime }

    return {
      details: details,
      scores: this.scores
    };
  }

  visited(point, rider, time) {
    const index = this.waypoints.findIndex(p => p.x === point.x && p.y === point.y);
    if (index !== -1) {
      const waypoint = this.waypoints[index];
      this.waypoints.splice(index, 1);

      const score = this.scores.find(entry => entry.rider.id === rider.id);
      if (score) {
        score.score += waypoint.value;
      } else {
        this.scores.push({
          rider: { id: rider.id, me: rider.me, firstName: rider.firstName, lastName: rider.lastName },
          score: waypoint.value
        })
      }

      this.scores.sort((a, b) => b.score - a.score);
    }
  }

  checkGameState() {
    const dateNow = new Date();
    const minutes = dateNow.getMinutes();
    const waiting = minutes < 10;

    dateNow.setMinutes(waiting ? 10 : 0, 0, 0);
    if (!waiting) {
      dateNow.setHours(dateNow.getHours() + 1);
    }

    if (!this.state.waiting && waiting) {
      this.waypoints = [];
    }
    if (this.state.waiting && !waiting) {
      this.scores = [];
      this.roadPoints = null;
    }

    this.state = {
      waiting,
      nextTime: dateNow
    };
  }

  checkWaypoints() {
    return this.getRoadPoints().then(roadPoints => {
      while(this.waypoints.length < counts[this.worldId]) {
        const index = Math.floor(Math.random() * roadPoints.length);

        if (!this.waypoints.find(waypoint =>
              distance(roadPoints[index], waypoint) < 25000
            )) {
          const { x, y } = roadPoints[index];
          const id = `Gold-${coin_id++}`;
          const value = Math.random() < 0.333 ? 3 : 1;

          this.waypoints.push({
            name: id,
            x,
            y,
            rotate: rotations[this.worldId],
            image: `goldrush_${value}`,
            id,
            value
          });
        }
      }

      return this.waypoints;
    })
  }

  getRoadPoints() {
    if (this.roadPoints) {
      return Promise.resolve(this.roadPoints);
    }

    const map = new Map({});
    return map.getSvg(this.worldId).then(svg => {
      // <polyline points="x1,y1 x2,y2"></polyline>
      let index = 0;
      const pointSets = [];
      while (index < svg.length && index !== -1) {
        index = svg.indexOf('<polyline ', index);
        if (index !== -1) {
          index = svg.indexOf('points="', index);
          if (index !== -1) {
            const endIndex = svg.indexOf('"', index + 8);
            if (endIndex !== -1) {
              const polyline = svg.substring(index + 8, endIndex);
              pointSets.push(this.pointsFromPolyline(polyline));
            }
          }
        }
      }

      this.roadPoints = [].concat.apply([], pointSets);
      return this.roadPoints;
    });
  }

  pointsFromPolyline(polyline) {
    return polyline.split(' ')
        .map(pair => {
          const coords = pair.split(',');
          if (coords.length === 2) {
            return { x: parseFloat(coords[0]), y: parseFloat(coords[1]) };
          }
        })
        .filter(point => !!point);
  }
}

module.exports = GoldRush;
