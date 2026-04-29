import { getCache } from '@/services/redis';

describe('Cache Connection', () => {
  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });


  it('should connect to the cache', async () => {
    const client = await getCache(); // returns existing instance
    // Minimal assertion without redisClient accessor
    expect(client).toBeDefined();
    if ('isOpen' in client) {
      expect((client as any).isOpen).toBe(true);
    }
  });
});