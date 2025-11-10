import { Request, Response } from 'express';
import bcrypt from 'bcrypt';

import logger from '../utils/logger';
import { getRepository } from "../db";
import { User } from "../models/User";
import { map } from '@/config/expressApp';


export const login = async (req: Request, res: Response) => {
  const { phoneNumber, password } = req.body ?? {};
  if (!phoneNumber || !password) {
    res.status(400).json({ error: 'Missing username or password' });
    return;
  }

  try {
    const repo = getRepository(User);
    const user = await repo.findOne({ where: { phone_number: phoneNumber } });
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
    logger.info('Updating session', { userId: req.session.userId, phoneNumber });
    res.status(200).send({ result: 'OK', message: 'Session updated', userId: user.id });
  } catch (e) {
    logger.error(e as Error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const register = async (req: Request, res: Response) => {
      const { username, phoneNumber, password } = req.body ?? {};
  if (!username || !phoneNumber || !password) {
    res.status(400).json({ error: 'Missing username, phoneNumber or password' });
    return;
  }

  try {
    const repo = getRepository(User);
    const existingName = await repo.findOne({ where: { username } });
    if (existingName) {
      res.status(409).json({ error: 'username already registered' });
      return;
    }
    const existingNumber = await repo.findOne({ where: { phone_number: phoneNumber } });
    if (existingNumber) {
      res.status(409).json({ error: 'phoneNumber already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = repo.create({ 
      username: username, 
      password_hash: passwordHash, 
      phone_number: phoneNumber, 
      signal_key_bundle: null // Will be uploaded after registration via /api/keys/upload
    });
    const saved = await repo.save(user as User);

    req.session.userId = String(saved.id);
    logger.info('Registering new user', { userId: req.session.userId, username });
    res.status(201).send({ result: 'Created', message: 'User registered and session updated', userId: saved.id });
  } catch (e) {
    logger.error(e as Error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const logout = async (req: Request, res: Response) => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const ws = map.get(req.session.userId);

  logger.info('Destroying session', { userId: req.session.userId });
  req.session.destroy(() => {
    if (ws) ws.close();
    res.send({ result: 'OK', message: 'Session destroyed' });
  });
}

export const me = async (req: Request, res: Response) => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json({ userId: req.session.userId });
}