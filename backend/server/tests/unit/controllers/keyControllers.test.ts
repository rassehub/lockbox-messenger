import { Request, Response } from 'express';

// Mock the service methods BEFORE importing controllers
const mockUploadKeyBundle = jest.fn();
const mockGetKeyBundle = jest.fn();
const mockGetKeyStats = jest.fn();
const mockNeedsMorePreKeys = jest.fn();
const mockGetAvailablePreKeyCount = jest.fn();
const mockAddOneTimePreKeys = jest.fn();
const mockRotateSignedPreKey = jest.fn();
const mockCleanupOldPreKeys =   jest.fn();

// Mock the SignalKeyService
jest.mock('@/services/signalKeyService', () => ({
  SignalKeyService: jest.fn().mockImplementation(() => ({
    uploadKeyBundle: mockUploadKeyBundle,
    getKeyBundle: mockGetKeyBundle,
    getKeyStats: mockGetKeyStats,
    needsMorePreKeys: mockNeedsMorePreKeys,
    getAvailablePreKeyCount: mockGetAvailablePreKeyCount,
    addOneTimePreKeys: mockAddOneTimePreKeys,
    rotateSignedPreKey: mockRotateSignedPreKey,
    cleanupOldPreKeys: mockCleanupOldPreKeys,
  })),
}));

jest.mock('@/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

// Mock getDataSource
jest.mock('@/db', () => ({
  getDataSource: jest.fn(() => ({
    getRepository: jest.fn(),
  })),
}));

import {
  uploadKeyBundle,
  getKeyBundle,
  getKeyStatistics,
  checkPreKeys,
  addPreKeys,
  rotateSignedPreKey,
} from '@/controllers/keyControllers';

describe('Key Controllers', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      session: { userId: 'user-123' } as any,
      body: {},
      params: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    // Suppress console.error in tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('uploadKeyBundle', () => {
    it('should upload key bundle successfully with valid data', async () => {
      const keyBundle = {
        registrationId: 12345,
        identityPubKey: 'public-key-base64',
        signedPreKey: {
          keyId: 1,
          publicKey: 'signed-key-base64',
          signature: 'signature-base64',
        },
        oneTimePreKeys: [
          { keyId: 1, publicKey: 'prekey1-base64' },
          { keyId: 2, publicKey: 'prekey2-base64' },
        ],
      };

      mockReq.body = { keyBundle };
      mockUploadKeyBundle.mockResolvedValue(undefined);

      await uploadKeyBundle(mockReq as Request, mockRes as Response);

      expect(mockUploadKeyBundle).toHaveBeenCalledWith('user-123', keyBundle);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Key bundle uploaded successfully',
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.session = undefined;

      await uploadKeyBundle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(mockUploadKeyBundle).not.toHaveBeenCalled();
    });

    it('should return 400 if keyBundle is missing', async () => {
      mockReq.body = {};

      await uploadKeyBundle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid key bundle format',
      });
      expect(mockUploadKeyBundle).not.toHaveBeenCalled();
    });

    it('should return 400 if keyBundle is missing required fields', async () => {
      mockReq.body = {
        keyBundle: {
          registrationId: 12345,
          // Missing other required fields
        },
      };

      await uploadKeyBundle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid key bundle format',
      });
    });

    it('should return 400 if oneTimePreKeys is not an array', async () => {
      mockReq.body = {
        keyBundle: {
          registrationId: 12345,
          identityPubKey: 'public-key',
          signedPreKey: { keyId: 1, publicKey: 'key', signature: 'sig' },
          oneTimePreKeys: 'not-an-array',
        },
      };

      await uploadKeyBundle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid key bundle format',
      });
    });

    it('should return 500 if service throws an error', async () => {
      const keyBundle = {
        registrationId: 12345,
        identityPubKey: 'public-key',
        signedPreKey: { keyId: 1, publicKey: 'key', signature: 'sig' },
        oneTimePreKeys: [],
      };

      mockReq.body = { keyBundle };
      mockUploadKeyBundle.mockRejectedValue(new Error('Database error'));

      await uploadKeyBundle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to upload key bundle',
      });
    });
  });

  describe('getKeyBundle', () => {
    it('should get key bundle successfully', async () => {
      const mockKeyBundle = {
        registrationId: 12345,
        identityPubKey: 'public-key',
        signedPreKey: { keyId: 1, publicKey: 'key', signature: 'sig' },
        oneTimePreKeys: [{ keyId: 42, publicKey: 'prekey-base64' }],
      };

      mockReq.body = { recipientId: 'user-456' };
      mockGetKeyBundle.mockResolvedValue(mockKeyBundle);

      await getKeyBundle(mockReq as Request, mockRes as Response);

      expect(mockGetKeyBundle).toHaveBeenCalledWith('user-456');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        keyBundle: mockKeyBundle,
      });
    });

    it('should return 503 if user has no available pre-keys', async () => {
      mockReq.body = { recipientId: 'user-456' };
      mockGetKeyBundle.mockRejectedValue(
        new Error('No available pre-keys. User needs to upload more pre-keys.')
      );

      await getKeyBundle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'User has no available pre-keys',
        message: 'The user needs to upload more pre-keys',
      });
    });

    it('should return 500 for other errors', async () => {
      mockReq.body = { recipientId: 'user-456' };
      mockGetKeyBundle.mockRejectedValue(new Error('Database connection failed'));

      await getKeyBundle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to fetch key bundle',
      });
    });
  });

  describe('getKeyStatistics', () => {
    it('should get key statistics successfully', async () => {
      const mockStats = {
        totalPreKeys: 100,
        availablePreKeys: 45,
        consumedPreKeys: 55,
        lastUpdated: new Date('2025-11-10'),
      };

      mockGetKeyStats.mockResolvedValue(mockStats);

      await getKeyStatistics(mockReq as Request, mockRes as Response);

      expect(mockGetKeyStats).toHaveBeenCalledWith('user-123');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        stats: mockStats,
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.session = undefined;

      await getKeyStatistics(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(mockGetKeyStats).not.toHaveBeenCalled();
    });

    it('should return 500 if service throws an error', async () => {
      mockGetKeyStats.mockRejectedValue(new Error('Service error'));

      await getKeyStatistics(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to fetch key stats',
      });
    });
  });

  describe('checkPreKeys', () => {
    it('should check pre-keys and return status', async () => {
      mockNeedsMorePreKeys.mockResolvedValue(true);
      mockGetAvailablePreKeyCount.mockResolvedValue(5);

      await checkPreKeys(mockReq as Request, mockRes as Response);

      expect(mockNeedsMorePreKeys).toHaveBeenCalledWith('user-123', 10);
      expect(mockGetAvailablePreKeyCount).toHaveBeenCalledWith('user-123');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        needsMorePreKeys: true,
        availableCount: 5,
        threshold: 10,
      });
    });

    it('should return false when user has enough pre-keys', async () => {
      mockNeedsMorePreKeys.mockResolvedValue(false);
      mockGetAvailablePreKeyCount.mockResolvedValue(50);

      await checkPreKeys(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        needsMorePreKeys: false,
        availableCount: 50,
        threshold: 10,
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.session = undefined;

      await checkPreKeys(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 500 if service throws an error', async () => {
      mockNeedsMorePreKeys.mockRejectedValue(new Error('Service error'));

      await checkPreKeys(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to check pre-keys',
      });
    });
  });

  describe('addPreKeys', () => {
    it('should add pre-keys successfully', async () => {
      const preKeys = [
        { keyId: 101, publicKey: 'prekey101-base64' },
        { keyId: 102, publicKey: 'prekey102-base64' },
      ];

      mockReq.body = { preKeys };
      mockAddOneTimePreKeys.mockResolvedValue(undefined);
      mockGetAvailablePreKeyCount.mockResolvedValue(52);

      await addPreKeys(mockReq as Request, mockRes as Response);

      expect(mockAddOneTimePreKeys).toHaveBeenCalledWith('user-123', preKeys);
      expect(mockGetAvailablePreKeyCount).toHaveBeenCalledWith('user-123');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Added 2 pre-keys',
        availableCount: 52,
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.session = undefined;

      await addPreKeys(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 400 if preKeys is not an array', async () => {
      mockReq.body = { preKeys: 'not-an-array' };

      await addPreKeys(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid pre-keys format',
      });
    });

    it('should return 400 if preKeys array is empty', async () => {
      mockReq.body = { preKeys: [] };

      await addPreKeys(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid pre-keys format',
      });
    });

    it('should return 500 if service throws an error', async () => {
      mockReq.body = { preKeys: [{ keyId: 1, publicKey: 'key' }] };
      mockAddOneTimePreKeys.mockRejectedValue(new Error('Database error'));

      await addPreKeys(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to add pre-keys',
      });
    });
  });

  describe('rotateSignedPreKey', () => {
    it('should rotate signed pre-key successfully', async () => {
      const signedPreKey = {
        keyId: 2,
        publicKey: 'new-signed-key-base64',
        signature: 'new-signature-base64',
      };

      mockReq.body = { signedPreKey };
      mockRotateSignedPreKey.mockResolvedValue(undefined);

      await rotateSignedPreKey(mockReq as Request, mockRes as Response);

      expect(mockRotateSignedPreKey).toHaveBeenCalledWith('user-123', signedPreKey);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Signed pre-key rotated successfully',
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.session = undefined;

      await rotateSignedPreKey(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 400 if signedPreKey is missing', async () => {
      mockReq.body = {};

      await rotateSignedPreKey(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid signed pre-key format',
      });
    });

    it('should return 400 if signedPreKey is missing keyId', async () => {
      mockReq.body = {
        signedPreKey: {
          publicKey: 'key',
          signature: 'sig',
        },
      };

      await rotateSignedPreKey(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid signed pre-key format',
      });
    });

    it('should return 400 if signedPreKey is missing publicKey', async () => {
      mockReq.body = {
        signedPreKey: {
          keyId: 1,
          signature: 'sig',
        },
      };

      await rotateSignedPreKey(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid signed pre-key format',
      });
    });

    it('should return 400 if signedPreKey is missing signature', async () => {
      mockReq.body = {
        signedPreKey: {
          keyId: 1,
          publicKey: 'key',
        },
      };

      await rotateSignedPreKey(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid signed pre-key format',
      });
    });

    it('should return 500 if service throws an error', async () => {
      mockReq.body = {
        signedPreKey: {
          keyId: 1,
          publicKey: 'key',
          signature: 'sig',
        },
      };
      mockRotateSignedPreKey.mockRejectedValue(new Error('Database error'));

      await rotateSignedPreKey(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to rotate signed pre-key',
      });
    });
  });
});
