/**
 * Unit tests for KeyService
 * Tests HTTP communication with the server
 */

import KeyService, { keyService } from '../../src/crypto/services/keyService';
import { SignalKeyBundle } from '../../src/crypto/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('KeyService', () => {
  let service: KeyService;
  const mockSessionCookie = 'session=test-cookie-123';
  const baseUrl = 'http://127.0.0.1:3000';

  beforeEach(() => {
    service = new KeyService(baseUrl);
    service.setSessionCookie(mockSessionCookie);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('uploadKeyBundle', () => {
    it('should upload key bundle successfully', async () => {
      const mockKeyBundle: SignalKeyBundle = {
        registrationId: 12345,
        identityPubKey: 'base64-identity-key',
        signedPreKey: {
          keyId: 1,
          publicKey: 'base64-signed-key',
          signature: 'base64-signature'
        },
        oneTimePreKeys: [
          { keyId: 1, publicKey: 'base64-prekey-1' },
          { keyId: 2, publicKey: 'base64-prekey-2' }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Key bundle uploaded successfully' })
      });

      await service.uploadKeyBundle(mockKeyBundle);

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/keys/upload`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': mockSessionCookie
          },
          body: JSON.stringify({ keyBundle: mockKeyBundle })
        })
      );
    });

    it('should throw error when upload fails', async () => {
      const mockKeyBundle: SignalKeyBundle = {
        registrationId: 12345,
        identityPubKey: 'test',
        signedPreKey: { keyId: 1, publicKey: 'test', signature: 'test' },
        oneTimePreKeys: []
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Unauthorized' })
      });

      await expect(service.uploadKeyBundle(mockKeyBundle)).rejects.toThrow('Unauthorized');
    });
  });

  describe('getKeyBundle', () => {
    it('should fetch key bundle for a user', async () => {
      const userId = 'user-456';
      const mockKeyBundle: SignalKeyBundle = {
        registrationId: 67890,
        identityPubKey: 'base64-identity-key',
        signedPreKey: {
          keyId: 1,
          publicKey: 'base64-signed-key',
          signature: 'base64-signature'
        },
        oneTimePreKeys: [
          { keyId: 42, publicKey: 'base64-prekey-42' }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, keyBundle: mockKeyBundle })
      });

      const result = await service.getKeyBundle(userId);

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/keys/${userId}`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': mockSessionCookie
          }
        })
      );
      expect(result).toEqual(mockKeyBundle);
    });

    it('should throw error when user keys not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'User not found' })
      });

      await expect(service.getKeyBundle('invalid-user')).rejects.toThrow('User not found');
    });
  });

  describe('getKeyStatistics', () => {
    it('should fetch key statistics', async () => {
      const mockStats = {
        totalPreKeys: 100,
        availablePreKeys: 45,
        consumedPreKeys: 55,
        lastUpdated: new Date('2025-11-20')
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, stats: mockStats })
      });

      const result = await service.getKeyStatistics();

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/keys/stats/me`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Cookie': mockSessionCookie
          })
        })
      );
      expect(result).toEqual(mockStats);
    });
  });

  describe('checkPreKeys', () => {
    it('should check if pre-keys need replenishment', async () => {
      const mockResponse = {
        success: true,
        needsMorePreKeys: true,
        availableCount: 5,
        threshold: 10
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await service.checkPreKeys();

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/keys/check-prekeys`,
        expect.objectContaining({
          method: 'POST'
        })
      );
      expect(result).toEqual(mockResponse);
      expect(result.needsMorePreKeys).toBe(true);
      expect(result.availableCount).toBe(5);
    });

    it('should return false when keys are sufficient', async () => {
      const mockResponse = {
        success: true,
        needsMorePreKeys: false,
        availableCount: 50,
        threshold: 10
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await service.checkPreKeys();

      expect(result.needsMorePreKeys).toBe(false);
      expect(result.availableCount).toBe(50);
    });
  });

  describe('addPreKeys', () => {
    it('should add new pre-keys successfully', async () => {
      const newPreKeys = [
        { keyId: 101, publicKey: 'base64-prekey-101' },
        { keyId: 102, publicKey: 'base64-prekey-102' },
        { keyId: 103, publicKey: 'base64-prekey-103' }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Added 3 pre-keys',
          availableCount: 53
        })
      });

      const newCount = await service.addPreKeys(newPreKeys);

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/keys/add-prekeys`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ preKeys: newPreKeys })
        })
      );
      expect(newCount).toBe(53);
    });
  });

  describe('rotateSignedPreKey', () => {
    it('should rotate signed pre-key successfully', async () => {
      const newSignedPreKey = {
        keyId: 2,
        publicKey: 'base64-new-signed-key',
        signature: 'base64-new-signature'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Signed pre-key rotated successfully'
        })
      });

      await service.rotateSignedPreKey(newSignedPreKey);

      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/keys/rotate-signed-prekey`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ signedPreKey: newSignedPreKey })
        })
      );
    });
  });

  describe('setSessionCookie', () => {
    it('should set session cookie for requests', async () => {
      const newCookie = 'session=new-cookie-456';
      service.setSessionCookie(newCookie);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, stats: {} })
      });

      await service.getKeyStatistics();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Cookie': newCookie
          })
        })
      );
    });

    it('should work without session cookie', async () => {
      service.setSessionCookie(null);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, stats: {} })
      });

      await service.getKeyStatistics();

      const call = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(call.headers).not.toHaveProperty('Cookie');
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(keyService).toBeInstanceOf(KeyService);
    });

    it('should use singleton instance with default base URL', () => {
      keyService.setSessionCookie('test-session');
      expect(keyService).toBeDefined();
    });
  });
});
