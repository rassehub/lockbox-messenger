import Redis from 'ioredis';
import logger from '../utils/logger';

let client: Redis | undefined;

export async function initCache() {
  if (client) return client;
  client = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: 6379,
    password: "cachepass",
  });
  client.on('error', (e: Error) => logger.error(e));
  await new Promise<void>((resolve, reject) => {
    client!.once('ready', () => resolve());
    client!.once('error', (err) => reject(err));
  });
  return client;
}

export async function closeCache() {
  if (client) {
    await client.quit();
  }
  client = undefined;
}

function ensure() {
  if (!client) throw new Error('Redis not initialized');
  return client;
}


export async function addMessage(recipientId: string, message: any) {
  try {
    const r = ensure();
    const key = `user:${recipientId}:messages`;
    await r.lpush(key, JSON.stringify(message));
    await r.expire(key, 86400);
  } catch (e) {
    // swallow for WS path (forwarding already done)
    logger.error(e as Error);
  }
}

export async function getMessages(recipientId: string) {
  const r = ensure();
  const key = `user:${recipientId}:messages`;
  const messages = await r.lrange(key, 0, -1);
  await r.del(key);
  return messages.map(m => JSON.parse(m));
}

export async function setUserOnline(userId: string) {
  const r = ensure();
  const key = `user:${userId}:status`;
  await r.set(key, 'online');
  await r.expire(key, 30);
}

