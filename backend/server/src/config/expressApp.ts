import express from 'express';
import logger from '../utils/logger';
import { WebSocket } from 'ws';
import sessionParser from '../middleware/session';
// Add these imports
import bcrypt from 'bcrypt';
import { AppDataSource } from '../db';
import { User } from '../models/User';


const map = new Map<string, WebSocket>(); // Exported for shared access


const app = express();

app.use(express.json());
app.use(express.static('public'));
app.use(sessionParser);

app.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    res.status(400).json({ error: 'Missing username or password' });
    return;
  }

  try {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { username } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    req.session.userId = String(user.id);
    logger.info('Updating session', { userId: req.session.userId, username });
    res.status(200).send({ result: 'OK', message: 'Session updated', userId: user.id });
  } catch (e) {
    logger.error(e as Error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Replace register with DB-backed creation
app.post('/register', async (req, res) => {
  const { username, displayName, password } = req.body ?? {};
  if (!username || !displayName || !password) {
    res.status(400).json({ error: 'Missing username, displayName or password' });
    return;
  }

  try {
    const repo = AppDataSource.getRepository(User);
    const existing = await repo.findOne({ where: { username } });
    if (existing) {
      res.status(409).json({ error: 'username already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = repo.create({ username, password_hash: passwordHash, display_name: displayName, public_key: "" });
    const saved = await repo.save(user as User);

    req.session.userId = String(saved.id);
    logger.info('Registering new user', { userId: req.session.userId, username });
    res.status(201).send({ result: 'Created', message: 'User registered and session updated', userId: saved.id });
  } catch (e) {
    logger.error(e as Error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/me', (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json({ userId: req.session.userId });
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