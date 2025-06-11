const { WebSocketServer } = require('ws');

function onSocketError(err) {
  console.error(err);
}

function setupWebSocketServer(server, sessionParser, map) {
  const wss = new WebSocketServer({ clientTracking: false, noServer: true });

  server.on('upgrade', function (request, socket, head) {
    socket.on('error', onSocketError);

    console.log('Parsing session from request...');

    sessionParser(request, {}, () => {
      if (!request.session.userId) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      console.log('Session is parsed!');
      socket.removeListener('error', onSocketError);

      wss.handleUpgrade(request, socket, head, function (ws) {
        wss.emit('connection', ws, request);
      });
    });
  });

  wss.on('connection', function (ws, request) {
    const userId = request.session.userId;

    map.set(userId, ws);

    ws.on('error', console.error);

    ws.on('message', function (message) {
      console.log(`Received message ${message} from user ${userId}`);
    });

    ws.on('close', function () {
      map.delete(userId);
    });
  });

  return wss;
}

module.exports = setupWebSocketServer;
