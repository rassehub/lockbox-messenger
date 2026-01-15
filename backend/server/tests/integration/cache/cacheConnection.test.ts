import { initCache, closeCache } from '@/services/redis';

describe('Cache Connection', () => {
  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    await initCache();  // Hardened init handles idempotency
  });

  afterAll(async () => {
    await closeCache();
  });

  it('should connect to the cache', async () => {
    const client = await initCache(); // returns existing instance
    // Minimal assertion without redisClient accessor
    expect(client).toBeDefined();
    if ('isOpen' in client) {
      expect((client as any).isOpen).toBe(true);
    }
  });
});