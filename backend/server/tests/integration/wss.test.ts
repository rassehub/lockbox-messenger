import http from 'http';
import request from 'supertest';
import { WebSocket } from 'ws';
import { createServer } from '@/createServer';
import { map } from '@/config/expressApp';
import { initDb, closeDb } from '@/db';

// Silence app logger
jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

// Stub Redis so WS delivery code doesn’t require a real cache
jest.mock('@/services/redis', () => ({
  __esModule: true,
  getMessages: jest.fn().mockResolvedValue([]),
  addMessage: jest.fn().mockResolvedValue(undefined),
  initCache: jest.fn().mockResolvedValue(undefined),
  closeCache: jest.fn().mockResolvedValue(undefined),
}));

describe('WebSocket Server', () => {
  let server: http.Server;
  let wss: any;
  let baseUrl: string;

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    await initDb(); // IMPORTANT: initialize DB before server/routes use it
    ({ server, wss } = createServer());
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        baseUrl = `http://127.0.0.1:${(server.address() as any).port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    // terminate any leftover sockets then close wss/server
    for (const [, ws] of map) { try { ws.terminate(); } catch {} }
    map.clear();
    await new Promise<void>((resolve) => wss.close(() => resolve()));
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeDb(); // close DB after server stops
  });

  afterEach(() => {
    for (const [, ws] of map) { try { ws.terminate(); } catch {} }
    map.clear();
  });

  it('rejects unauthenticated connections', async () => {
    const port = (server.address() as { port: number }).port;
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);

    await expect(
      new Promise((resolve) => {
        ws.once('error', resolve); // should error due to 401 upgrade
      })
    ).resolves.toBeDefined();
  });

  it('accepts authenticated connections', async () => {
    // Use real HTTP auth flow: register then login (username/password)
    const username = `u+${Date.now()}`; // avoid unique-constraint collisions across suites
    const displayName = `User ${Date.now()}`;
    await request(baseUrl).post('/register').send({ username, displayName, password: 'pw' }).expect(201);
    const loginRes = await request(baseUrl).post('/login').send({ username, password: 'pw' }).expect(200);

    const raw = loginRes.headers['set-cookie'] || [];
    const arr = Array.isArray(raw) ? raw : [raw];
    const cookieHeader = arr.map((c: string) => c.split(';')[0]).join('; ');

    const port = (server.address() as { port: number }).port;
    const ws = new WebSocket(`ws://127.0.0.1:${port}`, { headers: { Cookie: cookieHeader } });

    await new Promise<void>((resolve, reject) => {
      ws.once('open', () => { ws.close(); resolve(); });
      ws.once('error', reject);
    });
  });
});