import express from 'express';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { WebSocket } from 'ws';
import sessionParser from '../middleware/session';
import { isAuthenticated } from '../middleware/auth';


const map = new Map<string, WebSocket>(); // Exported for shared access


const app = express();

app.use(express.static('public'));
app.use(sessionParser);

app.post('/login', (req, res) => {
  const id = uuidv4();
  logger.info('Updating session', { userId: id });
  req.session.userId = id;
  res.send({ result: 'OK', message: 'Session updated' });
});

app.delete('/logout', (req, res) => {
  const ws = map.get(req.session.userId!);

  logger.info('Destroying session', { userId: req.session.userId });
  req.session.destroy(() => {
    if (ws) ws.close();
    res.send({ result: 'OK', message: 'Session destroyed' });
  });
});

export { app, sessionParser, map };