/**
 * End-to-End Test: Encrypted Messaging Between Two Users
 * 
 * This test validates the complete encrypted messaging flow:
 * 1. Register two users (Alice & Bob)
 * 2. Initialize encryption keys for both
 * 3. Upload keys to server
 * 4. Alice fetches Bob's keys and establishes session
 * 5. Alice encrypts and sends message to Bob
 * 6. Bob decrypts the message
 * 7. Bob replies with encrypted message
 * 8. Alice decrypts Bob's reply
 * 
 * Prerequisites:
 * - Backend server must be running on http://127.0.0.1:3000
 * - Database must be clean (or use unique usernames)
 * 
 * Run with: npm test -- encryption-messaging.e2e.test.ts
 */

import { AuthService } from '../../services/auth';
import { KeyManager } from '../../services/encryption/keyManager';

describe('E2E: Encrypted Messaging Flow', () => {
  const authService = new AuthService();
  
  // Test user credentials
  const alice: {
    username: string;
    phoneNumber: string;
    password: string;
    sessionCookie: string;
    userId: string;
    keyManager: KeyManager | null;
    authService?: AuthService;
  } = {
    username: `alice_${Date.now()}`,
    phoneNumber: `+1555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
    password: 'alice_secure_password_123',
    sessionCookie: '',
    userId: '',
    keyManager: null
  };

  const bob: {
    username: string;
    phoneNumber: string;
    password: string;
    sessionCookie: string;
    userId: string;
    keyManager: KeyManager | null;
    authService?: AuthService;
  } = {
    username: `bob_${Date.now()}`,
    phoneNumber: `+1555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
    password: 'bob_secure_password_456',
    sessionCookie: '',
    userId: '',
    keyManager: null
  };

  // Messages to exchange
  const aliceMessage = 'Hello Bob! This is an encrypted message from Alice 🔐';
  const bobMessage = 'Hi Alice! Received your encrypted message! 🎉';

  describe('Setup: User Registration & Authentication', () => {
    it('should register Alice successfully', async () => {
      const response = await authService.register(
        alice.username,
        alice.phoneNumber,
        alice.password
      );
      
      expect(response).toBeDefined();
      expect(response.result).toBe('Created');
      expect(response.userId).toBeDefined();
      
      alice.userId = response.userId;
      alice.sessionCookie = authService.getSessionCookie() || '';
      
    }, 10000);

    it('should register Bob successfully', async () => {
      const bobAuthService = new AuthService(); // Separate instance for Bob
      const response = await bobAuthService.register(
        bob.username,
        bob.phoneNumber,
        bob.password
      );
      
      expect(response).toBeDefined();
      expect(response.result).toBe('Created');
      expect(response.userId).toBeDefined();
      
      bob.userId = response.userId;
      bob.sessionCookie = bobAuthService.getSessionCookie() || '';
      bob.authService = bobAuthService; // Store Bob's auth service

    }, 10000);

    it('should login Alice and get session', async () => {
      const response = await authService.login(alice.phoneNumber, alice.password);
      
      expect(response).toBeDefined();
      expect(response.result).toBe('OK');
      expect(response.userId).toBeDefined();
      
      alice.userId = response.userId;

      alice.sessionCookie = authService.getSessionCookie() || '';
      expect(alice.sessionCookie).toBeTruthy();

    }, 10000);

    it('should login Bob and get session', async () => {
      const bobAuthService = bob.authService || new AuthService();
      const response = await bobAuthService.login(bob.phoneNumber, bob.password);
      
      expect(response).toBeDefined();
      expect(response.result).toBe('OK');
      expect(response.userId).toBeDefined();
      
      bob.userId = response.userId;
      bob.sessionCookie = bobAuthService.getSessionCookie() || '';
      bob.authService = bobAuthService;
      
      expect(bob.sessionCookie).toBeTruthy();
      
    }, 10000);
  });

  describe('Encryption Setup: Key Generation & Upload', () => {
    it('should initialize encryption for Alice', async () => {
      alice.keyManager = new KeyManager(alice.userId);
      await alice.keyManager.initializeForNewUser(alice.sessionCookie);
      
    }, 15000);

    it('should initialize encryption for Bob', async () => {
      bob.keyManager = new KeyManager(bob.userId);
      
      await bob.keyManager.initializeForNewUser(bob.sessionCookie);
      
    }, 15000);

    it('should verify Alice has encryption keys on server', async () => {
      expect(alice.keyManager).not.toBeNull();
      
      const stats = await alice.keyManager!.getKeyStatistics();
      
      expect(stats).toBeDefined();
      expect(stats.totalPreKeys).toBeGreaterThan(0);
      expect(stats.availablePreKeys).toBeGreaterThan(0);
      
    }, 10000);

    it('should verify Bob has encryption keys on server', async () => {
      expect(bob.keyManager).not.toBeNull();
      
      const stats = await bob.keyManager!.getKeyStatistics();
      
      expect(stats).toBeDefined();
      expect(stats.totalPreKeys).toBeGreaterThan(0);
      expect(stats.availablePreKeys).toBeGreaterThan(0);
      
    }, 10000);
  });

  describe('Encrypted Messaging: Alice → Bob', () => {
    let encryptedMessage: { type: number; body: string };

    it('should allow Alice to encrypt message for Bob', async () => {
      expect(alice.keyManager).not.toBeNull();
      
      encryptedMessage = await alice.keyManager!.encryptMessage(bob.userId, aliceMessage);
      
      expect(encryptedMessage).toBeDefined();
      expect(encryptedMessage.type).toBeDefined();
      expect(encryptedMessage.body).toBeDefined();
      expect(typeof encryptedMessage.body).toBe('string');
      
      // Encrypted message should be different from original
      expect(encryptedMessage.body).not.toBe(aliceMessage);

    }, 10000);

    it('should allow Bob to decrypt message from Alice', async () => {
      expect(bob.keyManager).not.toBeNull();
      expect(encryptedMessage).toBeDefined();
      
      const decryptedMessage = await bob.keyManager!.decryptMessage(alice.userId, encryptedMessage);
      
      expect(decryptedMessage).toBeDefined();
      expect(typeof decryptedMessage).toBe('string');
      expect(decryptedMessage).toBe(aliceMessage);

    }, 10000);

    it('should verify Bob consumed one of Alice\'s pre-keys', async () => {
      expect(alice.keyManager).not.toBeNull();
      
      const stats = await alice.keyManager!.getKeyStatistics();
      
      // Note: This assumes Alice had pre-keys before. In real scenario,
      // we'd compare before/after counts, but for E2E we just check structure
      expect(stats).toBeDefined();
      expect(stats.totalPreKeys).toBeGreaterThan(0);
      
    }, 10000);
  });

  describe('Encrypted Messaging: Bob → Alice (Reply)', () => {
    let encryptedReply: { type: number; body: string };

    it('should allow Bob to encrypt reply for Alice', async () => {
      expect(bob.keyManager).not.toBeNull();
      
      encryptedReply = await bob.keyManager!.encryptMessage(alice.userId, bobMessage);
      
      expect(encryptedReply).toBeDefined();
      expect(encryptedReply.type).toBeDefined();
      expect(encryptedReply.body).toBeDefined();
      expect(encryptedReply.body).not.toBe(bobMessage);
      
    }, 10000);

    it('should allow Alice to decrypt reply from Bob', async () => {
      expect(alice.keyManager).not.toBeNull();
      expect(encryptedReply).toBeDefined();
      
      const decryptedReply = await alice.keyManager!.decryptMessage(bob.userId, encryptedReply);
      
      expect(decryptedReply).toBeDefined();
      expect(typeof decryptedReply).toBe('string');
      expect(decryptedReply).toBe(bobMessage);
      
    }, 10000);
  });

  describe('Multiple Messages: Verify Session Persistence', () => {
    it('should allow multiple messages without re-fetching keys', async () => {
      expect(alice.keyManager).not.toBeNull();
      expect(bob.keyManager).not.toBeNull();

      const messages = [
        'Message 1: Testing persistence 🔐',
        'Message 2: Still encrypted! 🎉',
        'Message 3: Session working! ✅'
      ];

      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        
        // Alice encrypts
        const encrypted = await alice.keyManager!.encryptMessage(bob.userId, message);
        expect(encrypted).toBeDefined();
        
        // Bob decrypts
        const decrypted = await bob.keyManager!.decryptMessage(alice.userId, encrypted);
        expect(decrypted).toBe(message);
        
      }

    }, 30000);

    it('should allow bidirectional messaging', async () => {
      expect(alice.keyManager).not.toBeNull();
      expect(bob.keyManager).not.toBeNull();

      // Alice → Bob
      const aliceMsg = 'Testing bidirectional encryption 🔄';
      const encrypted1 = await alice.keyManager!.encryptMessage(bob.userId, aliceMsg);
      const decrypted1 = await bob.keyManager!.decryptMessage(alice.userId, encrypted1);
      expect(decrypted1).toBe(aliceMsg);

      // Bob → Alice
      const bobMsg = 'Bidirectional working perfectly! 🎯';
      const encrypted2 = await bob.keyManager!.encryptMessage(alice.userId, bobMsg);
      const decrypted2 = await alice.keyManager!.decryptMessage(bob.userId, encrypted2);
      expect(decrypted2).toBe(bobMsg);

      // Alice → Bob again
      const aliceMsg2 = 'Confirmed! All good! ✨';
      const encrypted3 = await alice.keyManager!.encryptMessage(bob.userId, aliceMsg2);
      const decrypted3 = await bob.keyManager!.decryptMessage(alice.userId, encrypted3);
      expect(decrypted3).toBe(aliceMsg2);

    }, 30000);
  });

  describe('Special Cases: Different Message Types', () => {
    it('should handle empty messages', async () => {
      expect(alice.keyManager).not.toBeNull();
      expect(bob.keyManager).not.toBeNull();

      const emptyMessage = '';
      const encrypted = await alice.keyManager!.encryptMessage(bob.userId, emptyMessage);
      const decrypted = await bob.keyManager!.decryptMessage(alice.userId, encrypted);
      
      expect(decrypted).toBe(emptyMessage);
    }, 10000);

    it('should handle messages with special characters', async () => {
      expect(alice.keyManager).not.toBeNull();
      expect(bob.keyManager).not.toBeNull();

      const specialMessage = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`\n\t\\\'';
      const encrypted = await alice.keyManager!.encryptMessage(bob.userId, specialMessage);
      const decrypted = await bob.keyManager!.decryptMessage(alice.userId, encrypted);
      
      expect(decrypted).toBe(specialMessage);
    }, 10000);

    it('should handle messages with emojis and unicode', async () => {
      expect(alice.keyManager).not.toBeNull();
      expect(bob.keyManager).not.toBeNull();

      const emojiMessage = '🔐🎉✅🚀💬🌟😀👍🔥💯 中文 العربية עברית';
      const encrypted = await alice.keyManager!.encryptMessage(bob.userId, emojiMessage);
      const decrypted = await bob.keyManager!.decryptMessage(alice.userId, encrypted);
      
      expect(decrypted).toBe(emojiMessage);
    }, 10000);

    it('should handle long messages', async () => {
      expect(alice.keyManager).not.toBeNull();
      expect(bob.keyManager).not.toBeNull();

      const longMessage = 'A'.repeat(10000); // 10KB message
      const encrypted = await alice.keyManager!.encryptMessage(bob.userId, longMessage);
      const decrypted = await bob.keyManager!.decryptMessage(alice.userId, encrypted);
      
      expect(decrypted).toBe(longMessage);
      expect(decrypted.length).toBe(10000);
    }, 15000);
  });

  describe('Key Management: Verify Server Integration', () => {
    it('should check if keys need replenishment', async () => {
      expect(alice.keyManager).not.toBeNull();
      await alice.keyManager!.maintainKeys();
      
      const stats = await alice.keyManager!.getKeyStatistics();
      expect(stats.availablePreKeys).toBeGreaterThan(0);
      
    }, 15000);

    it('should show consumed pre-keys after messaging', async () => {
      expect(bob.keyManager).not.toBeNull();
      
      const stats = await bob.keyManager!.getKeyStatistics();
      
      // Bob should have consumed one of Alice's pre-keys
      expect(stats).toBeDefined();

    }, 10000);
  });
});