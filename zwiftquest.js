const axios = require('axios')
const mapLatLong = require('zwift-mobile-api/src/mapLatLong');

const rotations = {
  1: 90,
  2: 90,
  3: 0
}

const WAYPOINTS_URL = 'https://drive.google.com/uc?id=1mEjLuwErn5DrjaIkhx13BVe2lC6j_iwv&export=download';

function getWaypoints(worldId) {
  return downloadQuest().then(quest => {
    if (worldId === quest.worldId) {
      const points = [
        toPoint(worldId, quest.start, 'zq_start')
      ];
      quest.waypoints.forEach(waypoint => {
        points.push(toPoint(worldId, waypoint, 'zq_waypoint'));
      })

      if (quest.finish && (quest.finish.lat != quest.start.lat || quest.finish.long != quest.start.long)) {
        points.push(toPoint(worldId, quest.finish, 'zq_start'));
      }
      return points;
    }
    return [];
  })
}

function toPoint(worldId, waypoint, image) {
  const xy = mapLatLong[worldId].toXY(waypoint.lat, waypoint.long);
  return {
    name: waypoint.name,
    x: xy.x,
    y: xy.y,
    image,
    rotate: rotations[worldId],
    size: 1.5
  };
}

function downloadQuest() {
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

function toLatLong(x, y) {
  return {
    lat: (x / 11050000) + 348.3551,
    long: (y / 10840000) + 166.9529
  }
}

module.exports = {
  getWaypoints
};
