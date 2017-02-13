const Server = require('zwift-second-screen/server/server');
const Login = require('zwift-second-screen/server/login');

const server = new Server(new Login());
server.start(process.env.PORT || 3000);
