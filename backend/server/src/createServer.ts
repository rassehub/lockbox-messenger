import http from 'http';
import { app, sessionParser, map } from './config/expressApp';
import setupWebSocketServer from './config/wss';

export function createServer() {
  const server = http.createServer(app);
  const wss = setupWebSocketServer(server, sessionParser as any, map);
  return { server, wss, map };
}