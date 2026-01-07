/// <reference path="./types/express.d.ts" />

import http from 'http';
import { app, sessionParser, map } from './config/expressApp';
import setupWebSocketServer from './config/wss';
import logger from './utils/logger';
import { initDb, closeDb } from './db';
import { initCache, closeCache } from './services/redis';

const PORT = parseInt(process.env.PORT || '3000', 10);

(async () => {
  try {
    await initDb();
    await initCache();

    const server = http.createServer(app);
    const wss = setupWebSocketServer(server, sessionParser as any, map);

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Shutting down on ${signal}`);
      for (const [, ws] of map) { try { ws.terminate(); } catch {} }
      map.clear();
      await new Promise<void>(resolve => wss.close(() => resolve()));
      await new Promise<void>(resolve => server.close(() => resolve()));
      await closeCache().catch(() => {});
      await closeDb().catch(() => {});
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    logger.error(err as Error);
    process.exit(1);
  }
})();