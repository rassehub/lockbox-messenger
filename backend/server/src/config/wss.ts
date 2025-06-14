import { WebSocketServer, WebSocket } from 'ws';
import logger from '../utils/logger';
import { IncomingMessage } from 'http';
import session from 'express-session';
import * as http from 'http';

function onSocketError(err: Error) {
  logger.error(err);
}

interface CustomRequest extends IncomingMessage {
  session: session.Session & Partial<session.SessionData>;
}

function setupWebSocketServer(
  server: ReturnType<typeof http.createServer>,
  sessionParser: ReturnType<typeof session>,
  map: Map<string, WebSocket>
) {
  const wss = new WebSocketServer({ clientTracking: false, noServer: true });

  server.on('upgrade', (request: IncomingMessage, socket, head) => {
    socket.on('error', onSocketError);

    logger.info('Parsing session from request...');

    sessionParser(request as any, {} as any, () => {
      const req = request as CustomRequest;
      
      if (!req.session.userId) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      logger.info('Session is parsed!');
      socket.removeListener('error', onSocketError);

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    });
  });

  wss.on('connection', (ws: WebSocket, request: CustomRequest) => {
    const userId = request.session.userId!;

    map.set(userId, ws);

    ws.on('error', console.error);

    ws.on('message', (message: Buffer) => {
      logger.info(`Received message ${message.toString()} from user ${userId}`);
    });

    ws.on('close', () => {
      map.delete(userId);
    });
  });

  return wss;
}

export default setupWebSocketServer;