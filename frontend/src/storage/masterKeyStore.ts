import * as Keychain from 'react-native-keychain';
import Aes from 'react-native-aes-crypto';

const KEYCHAIN_SERVICE = 'com.lockbock.masterkey';
const KEYCHAIN_USERNAME = 'master-key';
const KEY_LENGTH = 256;

export class MasterKeyStore {
  private static instance: MasterKeyStore;
  private masterKey: string | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): MasterKeyStore {
    if (!MasterKeyStore.instance) {
      MasterKeyStore.instance = new MasterKeyStore();
    }
    return MasterKeyStore.instance;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    const existing = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE,
    });

    if (existing) {
      this.masterKey = existing.password;
    } else {
      this.masterKey = await Aes.randomKey(KEY_LENGTH / 8); // 32 bytes → hex string
      await Keychain.setGenericPassword(KEYCHAIN_USERNAME, this.masterKey, {
        service: KEYCHAIN_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    }

    this.initialized = true;
  }

  private requireKey(): string {
    if (!this.masterKey) {
      throw new Error('MasterKeyStore not initialized. Call init() first.');
    }
    return this.masterKey;
  }

  async encrypt(plaintext: string): Promise<string> {
    const key = this.requireKey();
    const iv = await Aes.randomKey(16); // 16 bytes for AES-CBC IV
    const ciphertext = await Aes.encrypt(plaintext, key, iv, 'aes-256-cbc');
    return JSON.stringify({ iv, data: ciphertext });
  }

  async decrypt(envelope: string): Promise<string> {
    const key = this.requireKey();
    const { iv, data } = JSON.parse(envelope);
    return Aes.decrypt(data, key, iv, 'aes-256-cbc');
  }

  /** Wipes the master key from Keychain. Destroys access to all stored data. */
  async destroy(): Promise<void> {
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
    this.masterKey = null;
    this.initialized = false;
  }
}