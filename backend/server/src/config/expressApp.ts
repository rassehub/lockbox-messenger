import express from 'express';
import { WebSocket } from 'ws';

import sessionParser from '../middleware/session';
import authRoutes from '../routes/auth';
import keyRoutes from '../routes/keys';

const map = new Map<string, WebSocket>();

const app = express();

app.use(express.json());
app.use(express.static('public'));
app.use(sessionParser);

app.use('/auth', authRoutes);
app.use('/keys', keyRoutes);


export { app, sessionParser, map };