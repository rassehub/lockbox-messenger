/**
 * Integration tests for Key Management System
 * Tests the complete flow from client to server
 * 
 * Run with: npm test -- keyManagement.integration.test.ts
 */

import { KeyManager } from '../../src/crypto/managers/keyManager';
import KeyService from '../../src/crypto/services/keyService';
import { SignalProtocolManager } from '../../src/crypto/managers/SignalProtocolManager';

// Mock fetch for server communication
global.fetch = jest.fn();

describe('Key Management Integration', () => {
  let keyManager: KeyManager;
  let signalManager: SignalProtocolManager;
  const userId = 'integration-test-user';
  const sessionCookie = 'session=integration-test-cookie';

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Create fresh instances
    signalManager = SignalProtocolManager.createTestInstance();
    keyManager = new KeyManager(userId);

    // Reset state
    SignalProtocolManager.resetInstance();
  });

  afterEach(() => {
    SignalProtocolManager.resetInstance();
  });

  describe('New User Registration Flow', () => {
    it('should generate keys locally and upload to server', async () => {
      // Mock successful server upload
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Key bundle uploaded successfully'
        })
      });

      // Initialize as new user
      await keyManager.initializeForNewUser(sessionCookie);

      // Verify upload was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/keys/upload'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Cookie': sessionCookie
          }),
          body: expect.stringContaining('"registrationId"')
        })
      );

      // Verify key bundle structure
      const uploadCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(uploadCall[1].body);
      
      expect(body.keyBundle).toMatchObject({
        registrationId: expect.any(Number),
        identityPubKey: expect.any(String),
        signedPreKey: {
          keyId: expect.any(Number),
          publicKey: expect.any(String),
          signature: expect.any(String)
        },
        oneTimePreKeys: expect.arrayContaining([
          expect.objectContaining({
            keyId: expect.any(Number),
            publicKey: expect.any(String)
          })
        ])
      });

      // Should have at least 1 one-time pre-key (test mode generates 1, production generates 100)
      expect(body.keyBundle.oneTimePreKeys.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle server upload failure gracefully', async () => {
      // Mock server error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Server error'
        })
      });

      await expect(keyManager.initializeForNewUser(sessionCookie))
        .rejects.toThrow('Server error');
    });
  });

  describe('Existing User Login Flow', () => {
    it('should initialize without uploading keys', async () => {
      // Mock the checkPreKeys call that happens during initialization
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          needsMorePreKeys: false,
          availableCount: 50,
          threshold: 10
        })
      });

      await keyManager.initializeForExistingUser(sessionCookie);

      // Should only call check-prekeys endpoint, not upload
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/keys/check-prekeys'),
        expect.any(Object)
      );
    });
  });

  describe('Message Encryption Flow', () => {
    const recipientId = 'recipient-user-123';

    beforeEach(async () => {
      // Mock successful initialization
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await keyManager.initializeForNewUser(sessionCookie);
      jest.clearAllMocks();
    });

    it('should fetch recipient keys and establish session on first message', async () => {
      const message = 'Hello, this is a test message!';

      // Generate real recipient keys
      const recipientSignalManager = SignalProtocolManager.createTestInstance();
      await recipientSignalManager.initialize(recipientId);
      const recipientKeys = await recipientSignalManager.getKeyBundle();

      // Mock fetching recipient's key bundle with real keys
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          keyBundle: {
            registrationId: recipientKeys.registrationId,
            identityPubKey: Buffer.from(recipientKeys.identityPubKey).toString('base64'),
            signedPreKey: {
              keyId: recipientKeys.signedPreKey.keyId,
              publicKey: Buffer.from(recipientKeys.signedPreKey.publicKey).toString('base64'),
              signature: Buffer.from(recipientKeys.signedPreKey.signature).toString('base64')
            },
            oneTimePreKeys: recipientKeys.oneTimePreKeys.map(key => ({
              keyId: key.keyId,
              publicKey: Buffer.from(key.publicKey).toString('base64')
            }))
          }
        })
      });

      const encrypted = await keyManager.encryptMessage(recipientId, message);

      // Verify key bundle fetch
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/keys/get-recipient-keybundle`),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Cookie': sessionCookie
          }),
          body: JSON.stringify({ userId: recipientId })
        })
      );

      // Verify encryption result
      expect(encrypted).toBeDefined();
      expect(encrypted.body).toBeDefined();
      expect(encrypted.type).toBeDefined();
    });

    it('should skip key fetch if session already exists', async () => {
      const message = 'Second message';

      // First, establish a session with real keys
      const recipientSignalManager = SignalProtocolManager.createTestInstance();
      await recipientSignalManager.initialize(recipientId);
      const recipientKeys = await recipientSignalManager.getKeyBundle();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          keyBundle: {
            registrationId: recipientKeys.registrationId,
            identityPubKey: Buffer.from(recipientKeys.identityPubKey).toString('base64'),
            signedPreKey: {
              keyId: recipientKeys.signedPreKey.keyId,
              publicKey: Buffer.from(recipientKeys.signedPreKey.publicKey).toString('base64'),
              signature: Buffer.from(recipientKeys.signedPreKey.signature).toString('base64')
            },
            oneTimePreKeys: recipientKeys.oneTimePreKeys.map(key => ({
              keyId: key.keyId,
              publicKey: Buffer.from(key.publicKey).toString('base64')
            }))
          }
        })
      });

      await keyManager.encryptMessage(recipientId, 'First message');
      jest.clearAllMocks();

      // Second message should not fetch keys
      const encrypted = await keyManager.encryptMessage(recipientId, message);

      expect(global.fetch).not.toHaveBeenCalled();
      expect(encrypted).toBeDefined();
    });
  });

});