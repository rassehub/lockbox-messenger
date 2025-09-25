import { WebSocketServer, WebSocket } from 'ws';
import logger from '../utils/logger';
import { IncomingMessage } from 'http';
import session from 'express-session';
import * as http from 'http';
import { addMessage, getMessages } from '../services/redis';

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

        // Deliver any queued (offline) messages
    (async () => {
      try {
        const pending = await getMessages(userId);
        if (pending.length) {
          logger.info(`Delivering ${pending.length} queued messages to ${userId}`);
      }
        for (const msg of pending) {
          ws.send(JSON.stringify({ type: 'MESSAGE', ...msg }));
        }
      } catch (e) {
        logger.error(e as Error);
      }
    })();
    
      ws.on('message', async (message: Buffer) => {
      logger.info(`Received message ${message.toString()} from user ${userId}`);
      try {
        const parsed = JSON.parse(message.toString());

        if (parsed?.type === 'SEND') {
          const { recipientId, ciphertext } = parsed;
          if (!recipientId || !ciphertext) {
            ws.send(JSON.stringify({ type: 'ACK', ok: false, error: 'Invalid payload' }));
            return;
          }

          const payload = { sender: userId, ciphertext, timestamp: new Date() };

        // Forward immediately if recipient is online (don’t depend on Redis)
        const recipientWs = map.get(recipientId);
        if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
          recipientWs.send(JSON.stringify({ type: 'MESSAGE', ...payload }));
        }

        // ACK promptly
        ws.send(JSON.stringify({ type: 'ACK', ok: true }));

        // Queue in background; log on failure
        Promise.resolve(addMessage(recipientId, payload)).catch((e) => logger.error(e));
        return;
      }

        // Unknown type
        ws.send(JSON.stringify({ type: 'ACK', ok: false, error: 'Unknown type' }));
      } catch (err) {
        logger.error(err as Error);
        ws.send(JSON.stringify({ type: 'ACK', ok: false, error: 'Malformed JSON' }));
      }
    });

    ws.on('close', () => {
      map.delete(userId);
    });
  });

  return wss;
}

export default setupWebSocketServer;