import { initCache, closeCache } from '@/services/redis';

beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    await initCache();
});

afterAll(async () => {
    await closeCache();
});