import { SecureStorage } from '../../src/storage/secureStorage';
import { SignalProtocolStore } from '../../src/crypto';
import {
  KeyPairType,
} from '@privacyresearch/libsignal-protocol-typescript';

describe('SecureStorage Integration', () => {
  let storage: SignalProtocolStore;

    // Helper to create ArrayBuffer from numbers
  const createArrayBuffer = (bytes: number[]): ArrayBuffer => {
    const uint8 = new Uint8Array(bytes);
    return uint8.buffer;
  };

  // Helper to create KeyPairType
  const createKeyPair = (pubBytes: number[], privBytes: number[]): KeyPairType => {
    return {
      pubKey: createArrayBuffer(pubBytes),
      privKey: createArrayBuffer(privBytes)
    };
  };

  const arrayBuffersEqual = (buf1: ArrayBuffer, buf2: ArrayBuffer): boolean => {
  if (buf1.byteLength !== buf2.byteLength) return false;
  
  const view1 = new Uint8Array(buf1);
  const view2 = new Uint8Array(buf2);
  
  for (let i = 0; i < buf1.byteLength; i++) {
    if (view1[i] !== view2[i]) return false;
  }
  
  return true;
}
  beforeEach(() => {
    storage = new SignalProtocolStore();
  });

  afterEach(async () => {
    await storage.clearAll();
  });

  describe('Scalar Storage', () => {
    it('should store and retrieve identity key pair', async () => {
      const mockKeyPair: KeyPairType = createKeyPair([1, 2, 3, 4, 5], [6, 7, 8, 9, 10]);;

      await storage.storeIdentityKeyPair(mockKeyPair);
      const retrieved = await storage.getIdentityKeyPair();

      expect(retrieved).toEqual(mockKeyPair);
      expect(arrayBuffersEqual(retrieved!.pubKey, mockKeyPair.pubKey)).toBe(true);
    });

    it('should store and retrieve registration ID', async () => {
      const registrationId = 12345;

      await storage.storeRegistrationId(registrationId);
      const retrieved = await storage.getLocalRegistrationId();

      expect(retrieved).toBe(registrationId);
    });
  });

  describe('Record Storage', () => {
    const mockKeyPair1: KeyPairType = createKeyPair([1, 2, 3, 4, 5], [6, 7, 8, 9, 10]);;

    const mockKeyPair2: KeyPairType = createKeyPair([1, 2, 3, 4, 5], [6, 7, 8, 9, 10]);;

    const mockIdentityKey = new Uint8Array([13, 14, 15]).buffer;
    const mockSessionData = 'encrypted-session-data';

    describe('Pre-keys', () => {
      it('should store and load pre-key', async () => {
        await storage.storePreKey(1, mockKeyPair1);
        const retrieved = await storage.loadPreKey(1);

        expect(retrieved).toEqual(mockKeyPair1);
        expect(arrayBuffersEqual(retrieved!.pubKey, mockKeyPair1.pubKey)).toBe(true);
      });

      it('should remove pre-key', async () => {
        await storage.storePreKey(2, mockKeyPair2);
        await storage.removePreKey(2);
        const retrieved = await storage.loadPreKey(2);

        expect(retrieved).toBeUndefined();
      });
    });

    describe('Signed Pre-keys', () => {
      it('should store and load signed pre-key', async () => {
        await storage.storeSignedPreKey('signed-1', mockKeyPair1);
        const retrieved = await storage.loadSignedPreKey('signed-1');

        expect(retrieved).toEqual(mockKeyPair1);
        expect(arrayBuffersEqual(retrieved!.pubKey, mockKeyPair1.pubKey)).toBe(true);
      });

      it('should remove signed pre-key', async () => {
        await storage.storeSignedPreKey('signed-2', mockKeyPair2);
        await storage.removeSignedPreKey('signed-2');
        const retrieved = await storage.loadSignedPreKey('signed-2');

        expect(retrieved).toBeUndefined();
      });
    });

    describe('Identity Keys', () => {
      it('should save and load recipient identity key', async () => {
        const identifier = '+1234567890';

        const changed = await storage.saveIdentity(identifier, mockIdentityKey);
        const retrieved = await storage.loadIdentityKey(identifier);

        expect(retrieved).toEqual(mockIdentityKey);
        expect(changed).toBe(true); // First time save
      });

      it('should detect when identity key changes', async () => {
        const identifier = '+1234567890';
        const newKey = new Uint8Array([99, 98, 97]).buffer;

        // First save
        await storage.saveIdentity(identifier, mockIdentityKey);
        // Save same key again
        const changed1 = await storage.saveIdentity(identifier, mockIdentityKey);
        // Save different key
        const changed2 = await storage.saveIdentity(identifier, newKey);

        expect(changed1).toBe(false); // Same key, no change
        expect(changed2).toBe(true);  // Different key, changed
      });
    });

    describe('Sessions', () => {
      it('should store and load session', async () => {
        const identifier = 'user@domain.1';

        await storage.storeSession(identifier, mockSessionData);
        const retrieved = await storage.loadSession(identifier);

        expect(retrieved).toBe(mockSessionData);
      });

      it('should remove session', async () => {
        const identifier = 'user@domain.2';

        await storage.storeSession(identifier, mockSessionData);
        await storage.removeSession(identifier);
        const retrieved = await storage.loadSession(identifier);

        expect(retrieved).toBeUndefined();
      });

      it('should remove all sessions', async () => {
        await storage.storeSession('user1', 'session1');
        await storage.storeSession('user2', 'session2');

        await storage.removeAllSessions('any-identifier'); // Uses removeItem('session')
        
        const retrieved1 = await storage.loadSession('user1');
        const retrieved2 = await storage.loadSession('user2');

        expect(retrieved1).toBeUndefined();
        expect(retrieved2).toBeUndefined();
      });
    });

    describe('Multiple Record Types Isolation', () => {
      it('should keep different record types separate', async () => {
        const sameKey = '123';
        
        // Store different data types under same key in different collections
        await storage.storePreKey(sameKey, mockKeyPair1);
        await storage.storeSignedPreKey(sameKey, mockKeyPair2);
        await storage.saveIdentity(sameKey, mockIdentityKey);
        await storage.storeSession(sameKey, mockSessionData);

        // Verify each retrieves correct type
        expect(await storage.loadPreKey(sameKey)).toEqual(mockKeyPair1);
        expect(await storage.loadSignedPreKey(sameKey)).toEqual(mockKeyPair2);
        expect(await storage.loadIdentityKey(sameKey)).toEqual(mockIdentityKey);
        expect(await storage.loadSession(sameKey)).toBe(mockSessionData);
      });
    });
  });

  describe('Helper Methods', () => {
    it('should generate correct session identifier', () => {
      const mockAddress = {
        getName: () => 'user@domain',
        getDeviceId: () => 42
      };

      const identifier = storage.getSessionIdentifier(mockAddress);
      expect(identifier).toBe('user@domain.42');
    });

    it('should always trust identities (stub implementation)', async () => {
      const trusted = await storage.isTrustedIdentity(
        'any-identifier',
        new ArrayBuffer(8),
        1 // any direction
      );
      
      expect(trusted).toBe(true);
    });
  });
});