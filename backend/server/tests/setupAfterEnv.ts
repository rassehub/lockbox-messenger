import { initDb, closeDb } from '@/db';
import { initCache, closeCache } from '@/services/redis';

// Mock the logger to avoid console output during tests
jest.mock('@/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

// This runs once before all test suites
beforeAll(async () => {
  await initDb();
  await initCache();
});

// This runs once after all test suites
afterAll(async () => {
  try {
  await closeCache();
    await closeDb();
  } catch (error) {
    console.error('Error closing connections:', error);
  }
});
