const Server = require('zwift-second-screen/server/server');
const Login = require('zwift-second-screen/server/login');
const RiderId = require('zwift-second-screen/server/riderId');
const settings = require('./settings');

const maintenanceMode = process.env.MaintenanceMode === '1' || process.env.MaintenanceMode === 'true';

const username = process.env.ServiceUsername;
const password = process.env.ServicePassword;

const stravaClientId = process.env.StravaClientId;
const strava = stravaClientId ? Object.assign({
  clientId: stravaClientId,
  clientSecret: process.env.StravaClientSecret
}, settings.strava) : undefined;

if (maintenanceMode) {
  console.log('Maintenance Mode is ON');
}
const trackingId = process.env.TrackingId;
const site = Object.assign({}, settings.site || {}, { trackingId, maintenanceMode });

const riderProvider = (username && password)
      ? new RiderId(username, password)
      : new Login();

const server = new Server(riderProvider, { worlds: settings.worlds, site, strava });
server.start(process.env.PORT || 8080);
