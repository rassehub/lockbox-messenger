import http from 'http';
import request from 'supertest';
import { WebSocket } from 'ws';
import { createServer } from '@/createServer';
import { initCache, closeCache } from '@/services/redis';
import { initDb, closeDb } from '@/db';

jest.mock('@/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const uniqueUsername = (prefix: string) =>
  `${prefix}+${Date.now()}_${Math.random().toString(36).slice(2)}`;

describe('WSS messages', () => {
  let server: http.Server;
  let wss: any;
  let map = new Map();
  let baseUrl: string;

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    await initDb();              // IMPORTANT: init DB for /register and /login
    await initCache();           // if you really want Redis; or mock it in this suite
    ({ server, wss, map } = createServer());
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const { port } = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    for (const [, ws] of map) { try { ws.terminate(); } catch {} }
    map.clear();
    // Guard against undefined wss/server if beforeAll failed
    if (wss) {
      await new Promise<void>((resolve) => wss.close(() => resolve()));
    }
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await closeDb();             // close DB after server stops
    await closeCache();          // close Redis after server stops
  });

  afterEach(() => {
    for (const [, ws] of map) { try { ws.terminate(); } catch {} }
    map.clear();
  });

  const login = async (username: string, password: string) => {
    const res = await request(baseUrl).post('/login').send({ username, password }).expect(200);
    const raw = res.headers['set-cookie'] || [];
    const arr = Array.isArray(raw) ? raw : [raw];
    const cookie = arr.map((c: string) => c.split(';')[0]).join('; ');
    const me = await request(baseUrl).get('/me').set('Cookie', cookie).expect(200);
    return { cookie, userId: me.body.userId as string };
  };

  const register = async (username: string, displayName: string, password: string) => {
    await request(baseUrl).post('/register').send({ username, displayName, password }).expect(201);
  };

  it('forwards message to an online recipient', async () => {
    const senderUsername = uniqueUsername('u');
    const recipientUsername = uniqueUsername('r');
    const senderDisplayName = uniqueUsername('sender');
    const recipientDisplayName = uniqueUsername('recipient');
    await register(senderUsername, senderDisplayName, 'pw');
    await register(recipientUsername, recipientDisplayName, 'pw');
    const sender = await login(senderUsername, 'pw');
    const recipient = await login(recipientUsername, 'pw');

    const port = (server.address() as { port: number }).port;

    const recipientWs = new WebSocket(`ws://127.0.0.1:${port}`, {
      headers: { Cookie: recipient.cookie },
    });
    await new Promise<void>((resolve, reject) => {
      recipientWs.once('open', resolve);
      recipientWs.once('error', reject);
    });

    const senderWs = new WebSocket(`ws://127.0.0.1:${port}`, {
      headers: { Cookie: sender.cookie },
    });
    await new Promise<void>((resolve, reject) => {
      senderWs.once('open', resolve);
      senderWs.once('error', reject);
    });

    const received = new Promise<any>((resolve, reject) => {
      const to = setTimeout(() => reject(new Error('recipient timeout')), 3000);
      recipientWs.once('message', (buf) => {
        clearTimeout(to);
        resolve(JSON.parse(buf.toString()));
      });
    });

    const ack = new Promise<any>((resolve, reject) => {
      const to = setTimeout(() => reject(new Error('ack timeout')), 3000);
      senderWs.once('message', (buf) => {
        clearTimeout(to);
        resolve(JSON.parse(buf.toString()));
      });
    });

    senderWs.send(JSON.stringify({
      type: 'SEND',
      recipientId: recipient.userId,
      ciphertext: 'hello',
    }));

    const msg = await received;
    const ackMsg = await ack;

    expect(msg.type).toBe('MESSAGE');
    expect(msg.ciphertext).toBe('hello');
    expect(typeof msg.sender).toBe('string');
    expect(ackMsg).toEqual(expect.objectContaining({ type: 'ACK', ok: true }));

    senderWs.close();
    recipientWs.close();
  });

  it('delivers queued message when recipient connects later', async () => {
    const senderUsername = uniqueUsername('u');
    const recipientUsername = uniqueUsername('r');
      const senderDisplayName = uniqueUsername('sender');
    const recipientDisplayName = uniqueUsername('recipient');
    await register(senderUsername, senderDisplayName, 'pw');
    await register(recipientUsername, recipientDisplayName, 'pw');
    const sender = await login(senderUsername, 'pw');
    const recipient = await login(recipientUsername, 'pw');

    const port = (server.address() as { port: number }).port;

    const senderWs = new WebSocket(`ws://127.0.0.1:${port}`, {
      headers: { Cookie: sender.cookie },
    });
    await new Promise<void>((resolve, reject) => {
      senderWs.once('open', resolve);
      senderWs.once('error', reject);
    });

    const ack = new Promise<any>((resolve, reject) => {
      const to = setTimeout(() => reject(new Error('ack timeout')), 4000);
      senderWs.once('message', (buf) => {
        clearTimeout(to);
        resolve(JSON.parse(buf.toString()));
      });
    });

    senderWs.send(JSON.stringify({
      type: 'SEND',
      recipientId: recipient.userId,
      ciphertext: 'queued-offline',
    }));

    const ackMsg = await ack;
    expect(ackMsg).toEqual(expect.objectContaining({ type: 'ACK', ok: true }));

    // Recipient connects later and should receive queued message
    const recipientWs = new WebSocket(`ws://127.0.0.1:${port}`, {
      headers: { Cookie: recipient.cookie },
    });

    const received = new Promise<any>((resolve, reject) => {
      const to = setTimeout(() => reject(new Error('queued message timeout')), 4000);
      recipientWs.once('message', (buf) => {
        clearTimeout(to);
        resolve(JSON.parse(buf.toString()));
      });
    });

    await new Promise<void>((resolve, reject) => {
      recipientWs.once('open', resolve);
      recipientWs.once('error', reject);
    });

    const msg = await received;
    expect(msg.type).toBe('MESSAGE');
    expect(msg.ciphertext).toBe('queued-offline');

    senderWs.close();
    recipientWs.close();
  });
});