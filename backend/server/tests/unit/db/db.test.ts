// Silence logger in unit tests
jest.mock('@/utils/logger', () => {
  const fake = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
  return { __esModule: true, default: fake, ...fake };
});

import { AppDataSource, initDb, closeDb } from '@/db';

describe('db.ts - initialization and cleanup (minimal)', () => {
  const originalIsInitialized = AppDataSource.isInitialized;

  afterEach(() => {
    (AppDataSource as any).isInitialized = originalIsInitialized;
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('initializes the database only once', async () => {
    (AppDataSource as any).isInitialized = false;

    const initSpy = jest
      .spyOn(AppDataSource, 'initialize')
      .mockImplementation(async () => {
        (AppDataSource as any).isInitialized = true;
        return AppDataSource as any;
      });

    await initDb();
    await initDb(); // idempotent

    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(AppDataSource.isInitialized).toBe(true);
  });

  it('does not initialize if already initialized', async () => {
    (AppDataSource as any).isInitialized = true;

    const initSpy = jest
      .spyOn(AppDataSource, 'initialize')
      .mockResolvedValue(AppDataSource as any);

    await initDb();

    expect(initSpy).not.toHaveBeenCalled();
  });

  it('closes the database only when initialized', async () => {
    (AppDataSource as any).isInitialized = true;

    const destroySpy = jest
      .spyOn(AppDataSource, 'destroy')
      .mockImplementation(async () => {
        (AppDataSource as any).isInitialized = false;
        return;
      });

    await closeDb();

    expect(destroySpy).toHaveBeenCalledTimes(1);
    expect(AppDataSource.isInitialized).toBe(false);

    // Not initialized -> no destroy call
    destroySpy.mockClear();
    await closeDb();
    expect(destroySpy).not.toHaveBeenCalled();
  });
});