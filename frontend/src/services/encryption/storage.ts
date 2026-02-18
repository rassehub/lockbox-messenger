/**
 * Signal Protocol Store implementation using AsyncStorage
 * Handles persistent storage of keys, sessions, and identity information
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SignalProtocolAddress,
  KeyPairType,
} from '@privacyresearch/libsignal-protocol-typescript';

export class SignalProtocolStore {
  private static instance: SignalProtocolStore;

  private constructor() {}

  public static getInstance(): SignalProtocolStore {
    if (!SignalProtocolStore.instance) {
      SignalProtocolStore.instance = new SignalProtocolStore();
    }
    return SignalProtocolStore.instance;
  }

  // ==================== Identity Key Management ====================

  /**
   * Get the local identity key pair
   */
  async getIdentityKeyPair(): Promise<KeyPairType | undefined> {
    const data = await AsyncStorage.getItem('identityKey');
    if (data) {
      const parsed = JSON.parse(data);
      return {
        pubKey: this.arrayBufferFromBase64(parsed.pubKey),
        privKey: this.arrayBufferFromBase64(parsed.privKey),
      };
    }
    return undefined;
  }

  /**
   * Get the local registration ID
   */
  async getLocalRegistrationId(): Promise<number | undefined> {
    const data = await AsyncStorage.getItem('registrationId');
    return data ? parseInt(data, 10) : undefined;
  }

  /**
   * Store identity key pair
   */
  async storeIdentityKeyPair(keyPair: KeyPairType): Promise<void> {
    const serialized = {
      pubKey: this.arrayBufferToBase64(keyPair.pubKey),
      privKey: this.arrayBufferToBase64(keyPair.privKey),
    };
    await AsyncStorage.setItem('identityKey', JSON.stringify(serialized));
  }

  /**
   * Store registration ID
   */
  async storeRegistrationId(registrationId: number): Promise<void> {
    await AsyncStorage.setItem('registrationId', registrationId.toString());
  }

  /**
   * Check if we trust the identity of a recipient
   */
  async isTrustedIdentity(
    identifier: string,
    identityKey: ArrayBuffer,
    direction: number
  ): Promise<boolean> {
    // For now, we trust all identities
    // In production, implement proper trust verification
    return true;
  }

  /**
   * Save identity for a recipient
   */
  async saveIdentity(identifier: string, identityKey: ArrayBuffer): Promise<boolean> {
    const existing = await this.loadIdentityKey(identifier);
    const key = this.arrayBufferToBase64(identityKey);
    
    await AsyncStorage.setItem(`identityKey:${identifier}`, key);
    
    // Return true if the key changed
    return existing !== key;
  }

  /**
   * Load identity key for a recipient
   */
  async loadIdentityKey(identifier: string): Promise<string | null> {
    return await AsyncStorage.getItem(`identityKey:${identifier}`);
  }

  // ==================== Pre-Key Management ====================

  /**
   * Load a pre-key
   */
  async loadPreKey(keyId: string | number): Promise<KeyPairType | undefined> {
    const data = await AsyncStorage.getItem(`preKey:${keyId}`);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        pubKey: this.arrayBufferFromBase64(parsed.pubKey),
        privKey: this.arrayBufferFromBase64(parsed.privKey),
      };
    }
    return undefined;
  }

  /**
   * Store a pre-key
   */
  async storePreKey(keyId: string | number, keyPair: KeyPairType): Promise<void> {
    const serialized = {
      pubKey: this.arrayBufferToBase64(keyPair.pubKey),
      privKey: this.arrayBufferToBase64(keyPair.privKey),
    };
    await AsyncStorage.setItem(`preKey:${keyId}`, JSON.stringify(serialized));
  }

  /**
   * Remove a pre-key
   */
  async removePreKey(keyId: string | number): Promise<void> {
    await AsyncStorage.removeItem(`preKey:${keyId}`);
  }

  // ==================== Signed Pre-Key Management ====================

  /**
   * Load a signed pre-key
   */
  async loadSignedPreKey(keyId: string | number): Promise<KeyPairType | undefined> {
    const data = await AsyncStorage.getItem(`signedPreKey:${keyId}`);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        pubKey: this.arrayBufferFromBase64(parsed.pubKey),
        privKey: this.arrayBufferFromBase64(parsed.privKey),
      };
    }
    return undefined;
  }

  /**
   * Store a signed pre-key
   */
  async storeSignedPreKey(keyId: string | number, keyPair: KeyPairType): Promise<void> {
    const serialized = {
      pubKey: this.arrayBufferToBase64(keyPair.pubKey),
      privKey: this.arrayBufferToBase64(keyPair.privKey),
    };
    await AsyncStorage.setItem(`signedPreKey:${keyId}`, JSON.stringify(serialized));
  }

  /**
   * Remove a signed pre-key
   */
  async removeSignedPreKey(keyId: string | number): Promise<void> {
    await AsyncStorage.removeItem(`signedPreKey:${keyId}`);
  }

  // ==================== Session Management ====================

  /**
   * Load a session
   */
  async loadSession(identifier: string): Promise<string | undefined> {
    const data = await AsyncStorage.getItem(`session:${identifier}`);
    return data || undefined;
  }

  /**
   * Store a session
   */
  async storeSession(identifier: string, record: string): Promise<void> {
    await AsyncStorage.setItem(`session:${identifier}`, record);
  }

  /**
   * Remove a session
   */
  async removeSession(identifier: string): Promise<void> {
    await AsyncStorage.removeItem(`session:${identifier}`);
  }

  /**
   * Remove all sessions for a recipient
   */
  async removeAllSessions(identifier: string): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const sessionKeys = keys.filter(key => key.startsWith(`session:${identifier}`));
    await AsyncStorage.multiRemove(sessionKeys);
  }

  /**
   * Get session identifier from address
   */
  getSessionIdentifier(address: SignalProtocolAddress): string {
    return `${address.getName()}.${address.getDeviceId()}`;
  }

  // ==================== Helper Methods ====================

  /**
   * Convert ArrayBuffer to Base64 string for storage
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string back to ArrayBuffer
   */
  private arrayBufferFromBase64(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Clear all stored data (use with caution!)
   */
  async clearAll(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const signalKeys = keys.filter(
      key =>
        key.startsWith('identityKey') ||
        key.startsWith('preKey:') ||
        key.startsWith('signedPreKey:') ||
        key.startsWith('session:') ||
        key === 'registrationId'
    );
    await AsyncStorage.multiRemove(signalKeys);
  }
}

export default SignalProtocolStore.getInstance();