/**
 * Signal Protocol Store implementation using SecureStorage
 * Handles persistent storage of keys, sessions, and identity information
 */

import { SecureStorage } from '../../storage/secureStorage';
import {
  SignalProtocolAddress,
  KeyPairType,
  PreKeyPairType
} from '../types';
import { encryptionCodecs } from './cryptoStorageCodecs';
import { EncryptionStorageSchema } from './cryptoStorageSchema';
import { ICryptoStorage } from '../interfaces/ICryptoStorage';

export class CryptoStorage  implements ICryptoStorage {
  private static instance: CryptoStorage;
  private storage 

  constructor(userId: string) {
    this.storage = new SecureStorage<EncryptionStorageSchema, typeof encryptionCodecs>(userId, encryptionCodecs);
  }
  
  public static getInstance(userId: string): CryptoStorage {
    if (!CryptoStorage.instance) {
      CryptoStorage.instance = new CryptoStorage(userId);
    }
    return CryptoStorage.instance;
  }
  
  private arrayBuffersEqual(buf1: ArrayBuffer, buf2: ArrayBuffer): boolean {
    if (buf1.byteLength !== buf2.byteLength) return false;

    const view1 = new Uint8Array(buf1);
    const view2 = new Uint8Array(buf2);

    for (let i = 0; i < buf1.byteLength; i++) {
      if (view1[i] !== view2[i]) return false;
    }

    return true;
  }

  // ==================== Identity Key Management ====================

  /**
   * Get the local identity key pair
   */
  async getIdentityKeyPair(): Promise<KeyPairType | undefined> {
    const data = await this.storage.getItem('identityKey');
    return data ? data : undefined;
  }

  /**
   * Get the local registration ID
   */
  async getLocalRegistrationId(): Promise<number | undefined> {
    const data = await this.storage.getItem('registrationId');
    return data ? data : undefined;
  }

  /**
   * Store identity key pair
   */
  async storeIdentityKeyPair(keyPair: KeyPairType): Promise<void> {
    await this.storage.setItem('identityKey', keyPair);
  }

  /**
   * Store registration ID
   */
  async storeLocalRegistrationId(registrationId: number): Promise<void> {
    await this.storage.setItem('registrationId', registrationId);
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
    const existing = await this.storage.getRecordItem('recipientIdentityKeys', identifier)
    const isDifferent = !existing ||
      existing.byteLength !== identityKey.byteLength ||
      !this.arrayBuffersEqual(existing, identityKey);

    await this.storage.upsertRecordItem('recipientIdentityKeys', identifier, identityKey);
    // Return true if the key changed

    return isDifferent;
  }

  /**
   * Load identity key for a recipient
   */
  async loadIdentityKey(identifier: string): Promise<ArrayBuffer | undefined> {
    return await this.storage.getRecordItem(`recipientIdentityKeys`, identifier);
  }

  // ==================== Pre-Key Management ====================

  /**
   * Load a pre-key
   */
  async loadPreKey(keyId: string | number): Promise<KeyPairType | undefined> {
    const key = String(keyId);
    const data = await this.storage.getRecordItem('preKeys', key);
    return data ? data : undefined;
  }

  async loadAllPreKeys(): Promise<PreKeyPairType[] | undefined> {
    const data = await this.storage.getFullRecord('preKeys');
    if (data) {
      const preKeyArray = Object.entries(data).map(([id, keyPair]) => ({
        keyId: Number(id), // Convert string key to number
        keyPair
      }));
      return preKeyArray
    }
    return undefined;
  }

  /**
   * Store a pre-key
   */
  async storePreKey(keyId: string | number, keyPair: KeyPairType): Promise<void> {
    const key = String(keyId);
    await this.storage.upsertRecordItem('preKeys', key, keyPair);
  }

  /**
   * Store a pre-key
   */
async storePreKeys(preKeys: {keyId: string | number, keyPair: KeyPairType}[]): Promise<void> {
    const existingRecord = await this.storage.getFullRecord('preKeys') || {};

    for(const item of preKeys){
        const id = String(item.keyId);
        existingRecord[id] = item.keyPair;
    }

    await this.storage.setItem('preKeys', existingRecord);
}

  async replacePreKeys(keyPairs: PreKeyPairType[]) {
    const record: Record<string, KeyPairType> = {};
    for (const item of keyPairs) {
      record[item.keyId] = item.keyPair;
    }
    await this.storage.setItem("preKeys", record);
  }

  /**
   * Remove a pre-key
   */
  async removePreKey(keyId: string | number): Promise<void> {
    const key = String(keyId);
    await this.storage.removeRecordItem('preKeys', key);
  }

  // ==================== Signed Pre-Key Management ====================

  /**
   * Load a signed pre-key
   */
  async loadSignedPreKey(keyId: string | number): Promise<KeyPairType | undefined> {
    const key = String(keyId);
    const data = await this.storage.getRecordItem('signedPreKeys', key);
    return data ? data : undefined;
  }

  /**
   * Store a signed pre-key
   */
  async storeSignedPreKey(keyId: string | number, keyPair: KeyPairType): Promise<void> {
    const key = String(keyId);
    await this.storage.upsertRecordItem('signedPreKeys', key, keyPair);
    await this.storeSignedPreKeyId(Number(keyId))
  }

  /**
   * Remove a signed pre-key
   */
  async removeSignedPreKey(keyId: string | number): Promise<void> {
    const key = String(keyId);
    await this.storage.removeRecordItem('signedPreKeys', key);
  }

  async storeSignedPreKeyId(keyId: number): Promise<void> {
    await this.storage.setItem("signedPreKeyId", keyId)
  }

  async loadSignedPreKeyId() : Promise<number | undefined> {
    const data = await this.storage.getItem("signedPreKeyId")
    return data ? data : undefined
  }
  // ==================== Session Management ====================

  /**
   * Load a session
   */
  async loadSession(identifier: string): Promise<string | undefined> {
    const data = await this.storage.getRecordItem('session', identifier);
    return data ? data : undefined;
  }

  /**
   * Store a session
   */
  async storeSession(identifier: string, session: string): Promise<void> {
    await this.storage.upsertRecordItem('session', identifier, session);
  }

  /**
   * Remove a session
   */
  async removeSession(identifier: string): Promise<void> {
    await this.storage.removeRecordItem('session', identifier);
  }

  /**
   * Remove all sessions for a recipient
   */
  async removeAllSessions(): Promise<void> {
    await this.storage.removeItem('session')
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
    await this.storage.removeItem('identityKey')
    await this.storage.removeItem('preKeys')
    await this.storage.removeItem('recipientIdentityKeys')
    await this.storage.removeItem('registrationId')
    await this.storage.removeItem('session')
  }
}


export default CryptoStorage;