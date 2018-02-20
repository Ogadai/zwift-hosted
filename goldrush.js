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
    this.maxAltitude = 0;

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
      ? { prompt: 'Game starts', time: this.state.nextTime }
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
          rider: { id: rider.id, firstName: rider.firstName, lastName: rider.lastName },
          score: waypoint.value
        })
      }

      this.scores.sort((a, b) => b.score - a.score);
    }
  }

  checkGameState() {
    const dateNow = new Date();
    const minutes = dateNow.getMinutes();
    const waiting = minutes < 5;

    dateNow.setMinutes(waiting ? 5 : 0, 0, 0);
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
          const { x, y, altitude } = roadPoints[index];
          const id = `Gold-${coin_id++}`;

          const altitudeRatio = Math.max(0.3, altitude / this.maxAltitude);
          const value = Math.random() < (altitudeRatio * 0.6) ? 3 : 1;

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
          // Check for the points
          const polyline = this.getAttribute(svg, index, 'points');
          if (polyline) {
            // Get the class
            const className = this.getAttribute(svg, index, 'class') || '';
            const classes = className.split(' ');
            if (classes.find(c => c == 'roadsegment')) {
              // See if there's an altitude
              const altitudeClass = classes.find(c => c.startsWith('altitude_'));
              const altitude = altitudeClass ? parseInt(altitudeClass.substring(9)) : 0;

              pointSets.push(this.pointsFromPolyline(polyline, altitude));
            }
          }
          index += 8;
        }
      }

      this.roadPoints = [].concat.apply([], pointSets);

      this.maxAltitude = this.roadPoints.reduce((max, point) => Math.max(max, point.altitude), 0);
      return this.roadPoints;
    });
  }

  getAttribute(elementStr, elementIndex, attributeName) {
    const index = elementStr.indexOf(`${attributeName}="`, elementIndex);
    if (index !== -1) {
      const len = attributeName.length + 2;
      const endIndex = elementStr.indexOf('"', index + len);
      if (endIndex !== -1) {
        return elementStr.substring(index + len, endIndex);
      }
    }
    return null;
  }

  pointsFromPolyline(polyline, altitude) {
    return polyline.split(' ')
        .map(pair => {
          const coords = pair.split(',');
          if (coords.length === 2) {
            return { x: parseFloat(coords[0]), y: parseFloat(coords[1]), altitude };
          }
        })
        .filter(point => !!point);
  }
}

module.exports = GoldRush;
