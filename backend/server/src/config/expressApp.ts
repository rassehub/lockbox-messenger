import express from 'express';
import { WebSocket } from 'ws';

import sessionParser from '../middleware/session';
import authRoutes from '../routes/auth';

const map = new Map<string, WebSocket>();

const app = express();

app.use(express.json());
app.use(express.static('public'));
app.use(sessionParser);

app.use('/', authRoutes);

export { app, sessionParser, map };