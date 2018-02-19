const NodeCache = require('node-cache')
const axios = require('axios')
const mapLatLong = require('zwift-mobile-api/src/mapLatLong');

const poiCache = new NodeCache({ stdTTL: 30 * 60, checkPeriod: 120, useClones: false });

const rotations = {
  1: 90,
  2: 90,
  3: 0
}

const WAYPOINTS_URL = 'http://zwiftquest.com/wp-content/uploads/2018/02/waypoints.txt';

function getWaypoints(worldId) {
  const cacheId = `zwiftquest-${worldId}`;
  const cachedPoints = poiCache.get(cacheId);

  if (cachedPoints) {
    return Promise.resolve(cachedPoints);
  } else {
    return getFromZwiftQuest(worldId).then(points => {
      poiCache.set(cacheId, points);
      return points;
    })
  }
}

function credit() {
  return { prompt: 'Event details at', name: 'ZwiftQuest', href: 'http://zwiftquest.com/' };
}

function infoPanel() {
  return {
    details: credit(),
    showWaypoints: true
  };
}

function getFromZwiftQuest(worldId) {
  return downloadQuest().then(quest => {
    if (worldId === quest.worldId) {
      const points = [
        toPoint(worldId, quest.start, { image: 'zq_start', role: 'start' })
      ];
      quest.waypoints.forEach(waypoint => {
        points.push(toPoint(worldId, waypoint, { image: 'zq_waypoint' }));
      })

      points.push(toPoint(worldId, quest.finish, { image: 'zq_finish', role: 'finish' }));
      return points;
    }
    return [];
  })
}

function toPoint(worldId, waypoint, props) {
  const mapDef = mapLatLong[worldId];
  const xy = mapDef.toXY(waypoint.lat + mapDef.offset.lat, waypoint.long + mapDef.offset.long);
  return Object.assign({
    name: waypoint.name,
    x: xy.x,
    y: xy.y,
    rotate: rotations[worldId],
    size: 1.8
  }, props);
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
  getWaypoints,
  credit,
  infoPanel
};
