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

class GoldRush {
  constructor(worldId) {
    this.worldId = worldId;
    this.roadPoints = null;
    this.waypoints = [];
  }

  get() {
    return this.checkWaypoints();
  }

  visited(point, rider, time) {
    console.log(`${rider.id} visited ${point.name} at ${moment(time).format('MMMM Do YYYY, h:mm:ss a')}`);
    const index = this.waypoints.findIndex(p => p.x === point.x && p.y === point.y);
    if (index !== -1) {
      this.waypoints.splice(index, 1);
    }
  }

  checkWaypoints() {
    return this.getRoadPoints().then(roadPoints => {
      while(this.waypoints.length < counts[this.worldId]) {
        const index = Math.floor(Math.random() * roadPoints.length);

        if (!this.waypoints.find(waypoint =>
              distance(roadPoints[index], waypoint) < 25000
            )) {
          const { x, y } = roadPoints[index];
          this.waypoints.push({
            name: 'Gold',
            x,
            y,
            rotate: rotations[this.worldId],
            image: 'goldrush_3'
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
            return { x: coords[0], y: coords[1] };
          }
        })
        .filter(point => !!point);
  }
}

module.exports = GoldRush;
