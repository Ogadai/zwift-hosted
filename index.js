const Server = require('zwift-second-screen/server/server');
const Login = require('zwift-second-screen/server/login');
const RiderId = require('zwift-second-screen/server/riderId');
const settings = require('./settings');

const username = process.env.ServiceUsername;
const password = process.env.ServicePassword;

const trackingId = process.env.TrackingId;
const site = Object.assign({}, settings.site || {}, { trackingId });

const riderProvider = (username && password)
      ? new RiderId(username, password)
      : new Login();

const server = new Server(riderProvider, { worlds: settings.worlds, site });
server.start(process.env.PORT || 3000);
