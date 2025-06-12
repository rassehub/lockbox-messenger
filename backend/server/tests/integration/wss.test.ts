import http from 'http';
import { WebSocket } from 'ws';
import setupWebSocketServer from '../../src/server/wss';
import { app, sessionParser, map } from '../../src/server/expressApp';
import request from 'supertest';


jest.mock('typeorm', () => ({
  getRepository: jest.fn(() => ({
    findOne: jest.fn().mockResolvedValue({ id: '1', username: 'test' }),
  })),
}));

jest.mock('../../src/services/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));


describe('WebSocket Server', () => {
  let server: http.Server;
  let wss: ReturnType<typeof setupWebSocketServer>;

  beforeAll((done) => {
    server = http.createServer(app);
    wss = setupWebSocketServer(server, sessionParser, map);
    server.listen(() => done());
  });

  afterAll((done) => {
    wss.close(() => {
      server.close(() => done());
    });
  });

  it('rejects unauthenticated connections', async () => {
    const ws = new WebSocket(`ws://localhost:${(server.address() as any).port}`);

    await expect(
      new Promise((resolve) => {
        ws.on('error', resolve);
      })
    ).resolves.toBeDefined(); // Expect an error
  });

  it('accepts authenticated connections', async () => {
    // First, get a session ID
    const agent = request.agent(app);
    await agent.post('/login').expect(200);

    const cookieAccessInfo = {
      domain: '127.0.0.1',
      path: '/',
      secure: false,
      script: false
    };
    // First, get the cookies from the agent
    const cookies = agent.jar.getCookies(cookieAccessInfo);
    const cookieHeader = cookies.map(c => c.toString()).join('; ');

    // Then, connect to WebSocket with cookies
    const ws = new WebSocket(`ws://localhost:${(server.address() as any).port}`, {
      headers: {
        Cookie: cookieHeader
      }
    });

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        ws.close();
        resolve();
      });
      ws.on('error', reject);
    });
  });
});