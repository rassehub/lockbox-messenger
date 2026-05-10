import http from 'http';
import { RequestHandler } from 'express';
import { app, map } from './config/expressApp';
import setupWebSocketServer from './config/wss';

export function createServer(sessionParser: RequestHandler) {
  const server = http.createServer(app);
  const wss = setupWebSocketServer(server, sessionParser as any, map);
  return { server, wss, map };
}