
import http from 'http';
import request from 'supertest';
import { createServer } from '@/createServer';


// Mock the logger to avoid console output during tests
jest.mock('@/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const uniqueUsername = (prefix: string) =>
  `${prefix}+${Date.now()}_${Math.random().toString(36).slice(2)}`;

describe('Auth flows (register, login, logout)', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    ({ server } = createServer());
    await new Promise<void>(resolve => {
      server.listen(0, () => {
        const { port } = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  const authUsername = uniqueUsername('auth');
  const authDisplayName = uniqueUsername('Auth User');

  it('registers a new user', async () => {
    await request(baseUrl).post('/register').send({ username: authUsername, displayName: authDisplayName, password: 'pw' }).expect(201);
  });
  it('cant register the same user twice', async () => {
    await request(baseUrl).post('/register').send({ username: authUsername, displayName: authDisplayName, password: 'pw' }).expect(409);
  });

  it('logs in and sets session cookie', async () => {
    const agent = request.agent(baseUrl);
    await agent.post('/login').send({ username: authUsername, password: 'pw' }).expect(200);
    await agent.get('/me').expect(200);
  });

  it('cant log in with wrong password', async () => {
    const agent = request.agent(baseUrl);
    await agent.post('/login').send({ username: authUsername, password: 'wrongpw' }).expect(401);
  });

  it('logs out and invalidates session', async () => {
    const agent = request.agent(baseUrl);
    await agent.post('/login').send({ username: authUsername, password: 'pw' }).expect(200);
    await agent.delete('/logout').expect(200);
    await agent.get('/me').expect(401);
  });
});