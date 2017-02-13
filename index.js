const Server = require('zwift-second-screen/server/server');
const Login = require('zwift-second-screen/server/login');
const settings = require('zwift-second-screen/settings');

const server = new Server(new Login(), { worlds: settings.worlds });
server.start(process.env.PORT || 3000);
