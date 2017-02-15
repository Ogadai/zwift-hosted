const Server = require('zwift-second-screen/server/server');
const Login = require('zwift-second-screen/server/login');
const RiderId = require('zwift-second-screen/server/riderId');
const settings = require('./settings');

const username = process.env.ServiceUsername;
const password = process.env.ServicePassword;

const riderProvider = (username && password)
      ? new RiderId(username, password)
      : new Login();

const server = new Server(riderProvider, { worlds: settings.worlds });
server.start(process.env.PORT || 3000);
