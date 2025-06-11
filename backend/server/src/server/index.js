const http = require('http');
const { app, sessionParser, map } = require('./expressApp');
const setupWebSocketServer = require('./wss');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

setupWebSocketServer(server, sessionParser, map);

server.listen(PORT, function () {
  console.log(`Server running on http://localhost:${PORT}`);
});
