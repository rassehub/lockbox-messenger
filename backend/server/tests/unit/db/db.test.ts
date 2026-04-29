// Silence logger in unit tests
jest.mock('@/utils/logger', () => {
  const fake = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
  return { __esModule: true, default: fake, ...fake };
});

// Mock the entire db module to prevent actual database connections
jest.mock('@/db', () => {
  const mockDataSource = {
    isInitialized: false,
    initialize: jest.fn(),
    destroy: jest.fn(),
  };

  let initPromise: Promise<any> | null = null;

  const mockInitDb = async () => {
    if (initPromise) {
      return initPromise;
    }

    if (mockDataSource.isInitialized) {
      return mockDataSource;
    }

    initPromise = (mockDataSource.initialize() as Promise<typeof mockDataSource>)
      .then(() => {
        mockDataSource.isInitialized = true;
        return mockDataSource;
      })
      .catch((err: Error) => {
        initPromise = null;
        throw err;
      });

    return initPromise;
  };

  const mockCloseDb = async () => {
    if (mockDataSource.isInitialized) {
      await mockDataSource.destroy();
      mockDataSource.isInitialized = false;
    }
    initPromise = null;
  };

  // Expose a way to reset initPromise for testing
  const resetInitPromise = () => {
    initPromise = null;
  };

  return {
    AppDataSource: mockDataSource,
    initDb: mockInitDb,
    closeDb: mockCloseDb,
    __resetInitPromise: resetInitPromise, // For testing only
  };
});

import { AppDataSource, initDb, closeDb } from '@/db';

describe('db.ts - initialization and cleanup', () => {
  beforeEach(() => {
    // Reset state before each test
    (AppDataSource as any).isInitialized = false;
    
    // Reset initPromise
    if ((require('@/db') as any).__resetInitPromise) {
      (require('@/db') as any).__resetInitPromise();
    }
    
    // Clear mock call history but keep implementations
    (AppDataSource.initialize as jest.Mock).mockClear();
    (AppDataSource.destroy as jest.Mock).mockClear();
  });

  describe('initDb', () => {
    it('calls AppDataSource.initialize when not initialized', async () => {
      (AppDataSource.initialize as jest.Mock).mockResolvedValue(AppDataSource);

      const result = await initDb();

      expect(AppDataSource.initialize).toHaveBeenCalledTimes(1);
      expect(result).toBe(AppDataSource);
    });

    it('returns AppDataSource without initializing when already initialized', async () => {
      (AppDataSource as any).isInitialized = true;
      (AppDataSource.initialize as jest.Mock).mockResolvedValue(AppDataSource);

      const result = await initDb();

      expect(AppDataSource.initialize).not.toHaveBeenCalled();
      expect(result).toBe(AppDataSource);
    });

    it('throws error when initialization fails', async () => {
      const error = new Error('Connection failed');
      (AppDataSource.initialize as jest.Mock).mockRejectedValue(error);

      await expect(initDb()).rejects.toThrow('Connection failed');
      expect(AppDataSource.initialize).toHaveBeenCalledTimes(1);
    });

    it('only initializes once for concurrent calls', async () => {
      (AppDataSource.initialize as jest.Mock).mockImplementation(() => {
        return new Promise(resolve => setTimeout(() => {
          (AppDataSource as any).isInitialized = true;
          resolve(AppDataSource);
        }, 100));
      });

      const [result1, result2, result3] = await Promise.all([
        initDb(),
        initDb(),
        initDb(),
      ]);

      expect(AppDataSource.initialize).toHaveBeenCalledTimes(1);
      expect(result1).toBe(AppDataSource);
      expect(result2).toBe(AppDataSource);
      expect(result3).toBe(AppDataSource);
    });
  });

  describe('closeDb', () => {
    it('calls AppDataSource.destroy when initialized', async () => {
      (AppDataSource as any).isInitialized = true;
      (AppDataSource.destroy as jest.Mock).mockResolvedValue(undefined);

      await closeDb();

      expect(AppDataSource.destroy).toHaveBeenCalledTimes(1);
      expect(AppDataSource.isInitialized).toBe(false);
    });

    it('does not call destroy when not initialized', async () => {
      (AppDataSource as any).isInitialized = false;
      (AppDataSource.destroy as jest.Mock).mockResolvedValue(undefined);

      await closeDb();

      expect(AppDataSource.destroy).not.toHaveBeenCalled();
    });
  });
});