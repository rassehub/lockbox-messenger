/**
 * Signal Protocol Store implementation using AsyncStorage
 * Handles persistent storage of keys, sessions, and identity information
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecureStorage } from '../../storage/secureStorage';
import { arrayBufferToBase64, base64ToArrayBuffer } from '../utils/bufferEncoding';
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
    const data = await SecureStorage.getItem('identityKey');
    if (data) {
      return {
        pubKey: data.pubKey,
        privKey: data.privKey,
      };
    }
    return undefined;
  }

  /**
   * Get the local registration ID
   */
  async getLocalRegistrationId(): Promise<number | undefined> {
    const data = await SecureStorage.getItem('registrationId');
    return data ? data : undefined;
  }

  /**
   * Store identity key pair
   */
  async storeIdentityKeyPair(keyPair: KeyPairType): Promise<void> {
    await SecureStorage.setItem('identityKey', keyPair);
  }

  /**
   * Store registration ID
   */
  async storeRegistrationId(registrationId: number): Promise<void> {
    await SecureStorage.setItem('registrationId', registrationId);
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
    const existing = await SecureStorage.getRecordItem('recipientIdentityKeys', identifier)


    await SecureStorage.upsertRecordItem('recipientIdentityKeys', identifier, identityKey);
    
    // Return true if the key changed
    return existing !== identityKey;
  }

  /**
   * Load identity key for a recipient
   */
  async loadIdentityKey(identifier: string): Promise<ArrayBuffer | undefined> {
    return await SecureStorage.getRecordItem(`recipientIdentityKeys`, identifier);
  }

  // ==================== Pre-Key Management ====================

  /**
   * Load a pre-key
   */
  async loadPreKey(keyId: string | number): Promise<KeyPairType | undefined> {
    const key = String(keyId); 
    const data = await SecureStorage.getRecordItem('preKeys', key);
    return data ? data : undefined;
  }

  /**
   * Store a pre-key
   */
  async storePreKey(keyId: string | number, keyPair: KeyPairType): Promise<void> {
    const key = String(keyId); 
    await SecureStorage.upsertRecordItem('preKeys', key, keyPair);
  }

  /**
   * Remove a pre-key
   */
  async removePreKey(keyId: string | number): Promise<void> {
    const key = String(keyId); 
    await SecureStorage.removeRecordItem('preKeys', key);
  }

  // ==================== Signed Pre-Key Management ====================

  /**
   * Load a signed pre-key
   */
  async loadSignedPreKey(keyId: string | number): Promise<KeyPairType | undefined> {
    const key = String(keyId); 
    const data = await SecureStorage.getRecordItem('signedPreKeys', key);
    return data ? data : undefined;
  }

  /**
   * Store a signed pre-key
   */
  async storeSignedPreKey(keyId: string | number, keyPair: KeyPairType): Promise<void> {
    const key = String(keyId); 
    await SecureStorage.upsertRecordItem('signedPreKeys', key, keyPair);
  }

  /**
   * Remove a signed pre-key
   */
  async removeSignedPreKey(keyId: string | number): Promise<void> {
    const key = String(keyId); 
    await SecureStorage.removeRecordItem('signedPreKeys', key);
  }

  // ==================== Session Management ====================

  /**
   * Load a session
   */
  async loadSession(identifier: string): Promise<string | undefined> {
    const data = await SecureStorage.getRecordItem('session', identifier);
    return data || undefined;
  }

  /**
   * Store a session
   */
  async storeSession(identifier: string, record: string): Promise<void> {
    await SecureStorage.upsertRecordItem('session', identifier, record);
  }

  /**
   * Remove a session
   */
  async removeSession(identifier: string): Promise<void> {
    await SecureStorage.removeRecordItem('session', identifier);
  }

  /**
   * Remove all sessions for a recipient
   */
  async removeAllSessions(identifier: string): Promise<void> {
    await SecureStorage.removeItem('session')
  }

  /**
   * Get session identifier from address
   */
  getSessionIdentifier(address: SignalProtocolAddress): string {
    return `${address.getName()}.${address.getDeviceId()}`;
  }

  // ==================== Helper Methods ====================



  /**
   * Clear all stored data (use with caution!)
   */
  async clearAll(): Promise<void> {
    await SecureStorage.removeItem('identityKey')
    await SecureStorage.removeItem('preKeys')
    await SecureStorage.removeItem('recipientIdentityKeys')
    await SecureStorage.removeItem('registrationId')
    await SecureStorage.removeItem('session')
  }
}

export default SignalProtocolStore.getInstance();