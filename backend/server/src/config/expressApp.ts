import express from 'express';
import { WebSocket } from 'ws';
import { RequestHandler } from 'express';

import authRoutes from '../routes/auth';
import keyRoutes from '../routes/keys';
import socialRoutes from '../routes/social';

const map = new Map<string, WebSocket>();
const app = express();

export function initApp(sessionParser: RequestHandler) {
    app.set('trust proxy', 1);
    app.use(express.json());
    app.use(express.static('public'));
    app.use(sessionParser);
    app.use('/auth', authRoutes);
    app.use('/keys', keyRoutes);
    app.use('/social', socialRoutes);
}

export { app, map };