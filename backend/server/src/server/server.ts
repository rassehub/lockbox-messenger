import http from 'http';
import { app, sessionParser, map } from './expressApp';
import setupWebSocketServer from './wss';
import logger from '../services/logger';

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

setupWebSocketServer(server, sessionParser as any, map);

server.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});