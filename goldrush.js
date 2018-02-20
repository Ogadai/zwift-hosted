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
let message_id = 1;

const MESSAGE_DISPLAY_SECONDS = 20;

class GoldRush {
  constructor(worldId) {
    this.worldId = worldId;
    this.roadPoints = null;
    this.maxAltitude = 0;

    this.state = {};
    this.waypoints = [];
    this.scores = [];
    this.messages = [];
  }

  get() {
    this.checkGameState();

    if (this.state.waiting) {
      return Promise.resolve([]);
    } else {
      return this.checkWaypoints();
    }
  }

  registerPlayer(rider) {
    this.addPlayerScore(rider, 0);
  }

  infoPanel() {
    const details = this.state.waiting
      ? { prompt: 'Game starts', time: this.state.nextTime }
      : { prompt: 'Game ends', time: this.state.nextTime }

    this.removeOldMessages();
    const messages = {
      type: this.state.waiting ? 'banner' : 'list',
      list: this.state.waiting ? this.getWinners() : this.messages
    };

    return {
      details,
      messages,
      scores: this.scores
    };
  }

  getWinners() {
    const topScore = this.scores.reduce((max, entry) => Math.max(max, entry.score), 0);
    return this.scores
        .filter(entry => entry.score === topScore)
        .map(entry => ({ id: `winner-${entry.rider.id}`, rider: entry.rider, text: `WINS!` }));
  }

  visited(point, rider, time) {
    const index = this.waypoints.findIndex(p => p.x === point.x && p.y === point.y);
    if (index !== -1) {
      const waypoint = this.waypoints[index];
      this.waypoints.splice(index, 1);

      this.addPlayerScore(rider, waypoint.value);

      if (waypoint.image == 'goldrush_chest') {
        // Spawn some new nearby waypoints
        for(let n = 0; n < 4; n++) {
          this.newWaypoint(5000, point => distance(point, waypoint) < 30000);
        }
      }
    }
  }

  addPlayerScore(rider, value) {
    const score = this.scores.find(entry => entry.rider.id === rider.id);
    if (score) {
      score.score += value;
    } else {
      this.scores.push({
        rider: { id: rider.id, firstName: rider.firstName, lastName: rider.lastName },
        score: value
      })
    }

    if (value > 0) {
      this.messages.push({
        id: message_id++,
        rider,
        text: `${value} point${value !== 1 ? 's' : ''}`,
        time: new Date()
      });
    }

    this.scores.sort((a, b) => b.score - a.score);
  }

  removeOldMessages() {
    this.messages = this.messages.filter(message => (new Date() - message.time) < MESSAGE_DISPLAY_SECONDS * 1000);
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
    return this.getRoadPoints().then(() => {
      while(this.waypoints.length < counts[this.worldId]) {
        this.newWaypoint(25000);
      }

      return this.waypoints;
    })
  }

  newWaypoint(minDistance, pointsFilter) {
    const roadPoints = pointsFilter
        ? this.roadPoints.filter(pointsFilter)
        : this.roadPoints;

    let attempts = 0;
    let added = false;
    while (!added && attempts < 10) {
      const index = Math.floor(Math.random() * roadPoints.length);
      const roadPoint = roadPoints[index];

      if (!this.waypoints.find(waypoint => distance(roadPoint, waypoint) < minDistance)) {
        const { x, y, altitude } = roadPoint;
        const id = `Gold-${coin_id++}`;

        const altitudeRatio = Math.max(0.3, altitude / this.maxAltitude);
        const isChest = pointsFilter ? false : Math.random() < (altitudeRatio * 0.1);
        const value = isChest ? 0 : Math.random() < (altitudeRatio * 0.6) ? 3 : 1;

        this.waypoints.push({
          name: id,
          x,
          y,
          rotate: rotations[this.worldId],
          image: `goldrush_${isChest ? 'chest' : value}`,
          id,
          value
        });
        added = true;
      }
      attempts++;
    }
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
