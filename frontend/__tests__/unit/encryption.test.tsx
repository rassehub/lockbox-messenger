import { SignalProtocolManagerClass } from '../../src/crypto';
import type { SignalProtocolManager } from '../../src/crypto/managers/SignalProtocolManager';
import type { KeyBundle, EncryptedMessage } from '../../src/crypto/types';

global.fetch = jest.fn();

describe('SignalProtocolManager', () => {
  // Shared test users
  let alice: SignalProtocolManager;
  let bob: SignalProtocolManager;
  let aliceKeyBundle: KeyBundle;
  let bobKeyBundle: KeyBundle;

  // Helper function to create and initialize a user
  async function createUser(userId: string): Promise<SignalProtocolManager> {
    const manager = SignalProtocolManagerClass.createTestInstance();
    await manager.initialize(userId);
    return manager;
  }

  // Helper function to establish session and get key bundle
  async function setupSession(
    sender: SignalProtocolManager,
    recipientId: string,
    recipientKeyBundle: KeyBundle
  ): Promise<void> {
    await sender.establishSession(recipientId, recipientKeyBundle);
  }

  // Clean up between tests
  afterEach(() => {
    SignalProtocolManagerClass.resetInstance();
  });

  describe('Initialization', () => {
    test('should initialize a user identity correctly', async () => {
      const userId = 'test-user';
      const manager = SignalProtocolManagerClass.createTestInstance();
      
      const identity = await manager.initialize(userId);
      
      expect(identity).toHaveProperty('userId', userId);
      expect(identity).toHaveProperty('registrationId');
      expect(identity).toHaveProperty('identityKeyPair');
      expect(identity.identityKeyPair).toHaveProperty('pubKey');
      expect(identity.identityKeyPair).toHaveProperty('privKey');
    });

    test('should return existing identity on re-initialization', async () => {
      const manager = SignalProtocolManagerClass.createTestInstance();
      
      const identity1 = await manager.initialize('user1');
      const identity2 = await manager.initialize('user1');
      
      expect(identity1.registrationId).toBe(identity2.registrationId);
    });

    test('should check if manager is initialized', async () => {
      const manager = SignalProtocolManagerClass.createTestInstance();
      
      expect(manager.isInitialized()).toBe(false);
      
      await manager.initialize('user1');
      
      expect(manager.isInitialized()).toBe(true);
    });
  });

  describe('Key Bundle Generation', () => {
    beforeEach(async () => {
      alice = await createUser('alice');
    });

    test('should generate a valid key bundle', async () => {
      const keyBundle = await alice.getKeyBundle();
      
      expect(keyBundle).toHaveProperty('registrationId');
      expect(keyBundle).toHaveProperty('identityPubKey');
      expect(keyBundle).toHaveProperty('signedPreKey');
      expect(keyBundle).toHaveProperty('oneTimePreKeys');
      expect(keyBundle.oneTimePreKeys.length).toBeGreaterThan(0);
    });

    test('should throw error if getting key bundle before initialization', async () => {
      const uninitializedManager = SignalProtocolManagerClass.createTestInstance();
      
      await expect(uninitializedManager.getKeyBundle()).rejects.toThrow(
        'SignalProtocolManager not initialized'
      );
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      alice = await createUser('alice');
      bob = await createUser('bob');
      aliceKeyBundle = await alice.getKeyBundle();
      bobKeyBundle = await bob.getKeyBundle();
    });

    test('should establish a session between two users', async () => {
      await alice.establishSession('bob', bobKeyBundle);
      
      const hasSession = await alice.hasSessionWith('bob');
      expect(hasSession).toBe(true);
    });

    test('should return false for non-existent session', async () => {
      const hasSession = await alice.hasSessionWith('charlie');
      expect(hasSession).toBe(false);
    });

    test('should remove a session', async () => {
      await alice.establishSession('bob', bobKeyBundle);
      expect(await alice.hasSessionWith('bob')).toBe(true);
      
      await alice.removeSession('bob');
      expect(await alice.hasSessionWith('bob')).toBe(false);
    });

    test('should remove all sessions with a user', async () => {
      await alice.establishSession('bob', bobKeyBundle);
      await alice.removeAllSessions('bob');
      
      expect(await alice.hasSessionWith('bob')).toBe(false);
    });
  });

  describe('Message Encryption & Decryption', () => {
    beforeEach(async () => {
      alice = await createUser('alice');
      bob = await createUser('bob');
      aliceKeyBundle = await alice.getKeyBundle();
      bobKeyBundle = await bob.getKeyBundle();
    });

    test('should encrypt and decrypt a message between two users', async () => {
      const message = 'Hello, this is a secret message!';

      // Alice establishes session with Bob
      await setupSession(alice, 'bob', bobKeyBundle);
      
      // Alice encrypts message for Bob
      const encrypted = await alice.encrypt('bob', message);
      
      expect(encrypted).toHaveProperty('type');
      expect(encrypted).toHaveProperty('body');
      expect(encrypted).toHaveProperty('registrationId');
      expect(typeof encrypted.body).toBe('string');
      expect(encrypted.body.length).toBeGreaterThan(0);

      // Bob decrypts message from Alice
      const decrypted = await bob.decrypt('alice', encrypted);
      expect(decrypted).toBe(message);
    });

    test('should encrypt without explicit session establishment when key bundle provided', async () => {
      const message = 'Auto-session message';

      // Alice encrypts for Bob WITHOUT establishing session first
      // (encrypt will create session automatically when keyBundle provided)
      const encrypted = await alice.encrypt('bob', message, bobKeyBundle);
      
      expect(encrypted).toHaveProperty('type');
      expect(encrypted).toHaveProperty('body');

      // Verify session was created
      const hasSession = await alice.hasSessionWith('bob');
      expect(hasSession).toBe(true);

      // Bob can decrypt
      const decrypted = await bob.decrypt('alice', encrypted);
      expect(decrypted).toBe(message);
    });

    test('should handle multiple messages in sequence', async () => {
      await setupSession(alice, 'bob', bobKeyBundle);
      
      const messages = [
        'First message',
        'Second message',
        'Third message'
      ];

      for (const msg of messages) {
        const encrypted = await alice.encrypt('bob', msg);
        const decrypted = await bob.decrypt('alice', encrypted);
        expect(decrypted).toBe(msg);
      }
    });

    test('should handle bidirectional messaging', async () => {
      // Establish sessions both ways
      await setupSession(alice, 'bob', bobKeyBundle);
      await setupSession(bob, 'alice', aliceKeyBundle);

      // Alice -> Bob
      const msg1 = 'Hello Bob!';
      const encrypted1 = await alice.encrypt('bob', msg1);
      const decrypted1 = await bob.decrypt('alice', encrypted1);
      expect(decrypted1).toBe(msg1);

      // Bob -> Alice
      const msg2 = 'Hi Alice!';
      const encrypted2 = await bob.encrypt('alice', msg2);
      const decrypted2 = await alice.decrypt('bob', encrypted2);
      expect(decrypted2).toBe(msg2);
    });

    test('should throw error when encrypting without session and no key bundle', async () => {
      await expect(alice.encrypt('bobby', 'test')).rejects.toThrow();
    });

    test('should handle empty messages', async () => {
      await setupSession(alice, 'bob', bobKeyBundle);
      
      const emptyMessage = '';
      const encrypted = await alice.encrypt('bob', emptyMessage);
      const decrypted = await bob.decrypt('alice', encrypted);
      
      expect(decrypted).toBe(emptyMessage);
    });

    test('should handle special characters and emojis', async () => {
      await setupSession(alice, 'bob', bobKeyBundle);
      
      const specialMessage = 'Hello! 🎉 Special chars: @#$%^&*()';
      const encrypted = await alice.encrypt('bob', specialMessage);
      const decrypted = await bob.decrypt('alice', encrypted);
      
      expect(decrypted).toBe(specialMessage);
    });

    test('should handle long messages', async () => {
      await setupSession(alice, 'bob', bobKeyBundle);
      
      const longMessage = 'A'.repeat(10000);
      const encrypted = await alice.encrypt('bob', longMessage);
      const decrypted = await bob.decrypt('alice', encrypted);
      
      expect(decrypted).toBe(longMessage);
    });
  });

  describe('Multi-User Conversations', () => {
    let charlie: SignalProtocolManager;
    let charlieKeyBundle: KeyBundle;

    beforeEach(async () => {
      alice = await createUser('alice');
      bob = await createUser('bob');
      charlie = await createUser('charlie');
      
      aliceKeyBundle = await alice.getKeyBundle();
      bobKeyBundle = await bob.getKeyBundle();
      charlieKeyBundle = await charlie.getKeyBundle();
    });

    test('should handle separate conversations with multiple users', async () => {
      // Alice sets up sessions with Bob and Charlie
      await setupSession(alice, 'bob', bobKeyBundle);
      await setupSession(alice, 'charlie', charlieKeyBundle);

      // Alice sends different messages to Bob and Charlie
      const msgToBob = 'Hey Bob!';
      const msgToCharlie = 'Hey Charlie!';

      const encryptedBob = await alice.encrypt('bob', msgToBob);
      const encryptedCharlie = await alice.encrypt('charlie', msgToCharlie);

      // Bob decrypts his message
      const decryptedBob = await bob.decrypt('alice', encryptedBob);
      expect(decryptedBob).toBe(msgToBob);

      // Charlie decrypts his message
      const decryptedCharlie = await charlie.decrypt('alice', encryptedCharlie);
      expect(decryptedCharlie).toBe(msgToCharlie);
    });

    test('should maintain separate session states for different recipients', async () => {
      await setupSession(alice, 'bob', bobKeyBundle);
      await setupSession(alice, 'charlie', charlieKeyBundle);

      expect(await alice.hasSessionWith('bob')).toBe(true);
      expect(await alice.hasSessionWith('charlie')).toBe(true);

      await alice.removeSession('bob');

      expect(await alice.hasSessionWith('bob')).toBe(false);
      expect(await alice.hasSessionWith('charlie')).toBe(true);
    });
  });

  describe('Reset Functionality', () => {
    test('should reset all encryption data', async () => {
      const manager = SignalProtocolManagerClass.createTestInstance();
      await manager.initialize('user1');
      
      expect(manager.isInitialized()).toBe(true);
      
      await manager.reset();
      
      expect(manager.isInitialized()).toBe(false);
    });

    test('should reset singleton instance', () => {
      const instance1 = SignalProtocolManagerClass.getInstance();
      SignalProtocolManagerClass.resetInstance();
      const instance2 = SignalProtocolManagerClass.getInstance();
      
      // Should be different instances after reset
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Error Handling', () => {
    test('should throw error when using uninitialized manager', async () => {
      const manager = SignalProtocolManagerClass.createTestInstance();
      
      await expect(manager.getKeyBundle()).rejects.toThrow(
        'SignalProtocolManager not initialized'
      );
      
      await expect(manager.encrypt('bob', 'test')).rejects.toThrow(
        'SignalProtocolManager not initialized'
      );
    });

    test('should handle decryption of invalid encrypted message', async () => {
      alice = await createUser('alice');
      bob = await createUser('bob');

      const invalidEncrypted: EncryptedMessage = {
        type: 999,
        body: 'invalid-data',
        registrationId: 12345,
      };

      await expect(bob.decrypt('alice', invalidEncrypted)).rejects.toThrow();
    });
  });
});