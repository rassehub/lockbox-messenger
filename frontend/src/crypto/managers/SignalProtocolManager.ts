/**
 * Main Signal Protocol Manager
 * High-level API for managing Signal Protocol encryption in the app
 */

import SignalProtocolStore from '../storage/SignalProtocolStorage';
import { createUserIdentity, generateKeyBundle, hasUserIdentity, getUserIdentity } from '../services/identity';
import { createSession, hasSession, deleteSession, deleteAllSessions } from '../services/session';
import { encryptMessage, decryptMessage } from '../services/crypto';
import type { UserIdentity, KeyBundle, EncryptedMessage } from '../types';

export class SignalProtocolManager {
  private static instance: SignalProtocolManager;
  private store = SignalProtocolStore;
  private initialized = false;

  // Allow direct instantiation for testing
  constructor(private useSharedStore = true) {}

  public static getInstance(): SignalProtocolManager {
    if (!SignalProtocolManager.instance) {
      SignalProtocolManager.instance = new SignalProtocolManager(true);
    }
    return SignalProtocolManager.instance;
  }
  
  /**
   * Create a new instance for testing purposes
   * This bypasses the singleton pattern
   */
  public static createTestInstance(): SignalProtocolManager {
    return new SignalProtocolManager(false);
  }
  
  /**
   * Reset the singleton instance (for testing)
   */
  public static resetInstance(): void {
    if (SignalProtocolManager.instance) {
      SignalProtocolManager.instance.store.clearAll();
      SignalProtocolManager.instance = undefined as any;
    }
  }

  /**
   * Initialize the Signal Protocol for the current user
   * Should be called after user login/registration
   */
  async initialize(userId: string): Promise<UserIdentity> {
    if (this.initialized) {
      const identity = await getUserIdentity(this.store);
      if (identity) {
        return identity;
      }
    }

    // Check if identity already exists
    const exists = await hasUserIdentity(this.store);
    let identity: UserIdentity;

    if (!exists) {
      // Create new identity
      identity = await createUserIdentity(userId, this.store);
    } else {
      // Load existing identity
      const existingIdentity = await getUserIdentity(this.store);
      if (!existingIdentity) {
        throw new Error('Failed to load user identity');
      }
      identity = existingIdentity;
    }

    this.initialized = true;
    return identity;
  }

  /**
   * Generate a key bundle to upload to the server
   * Other users will fetch this to establish sessions with you
   */
  async getKeyBundle(): Promise<KeyBundle> {
    this.ensureInitialized();
    return await generateKeyBundle(this.store);
  }

  /**
   * Establish a session with a recipient
   */
  async establishSession(recipientId: string, keyBundle: KeyBundle): Promise<void> {
    this.ensureInitialized();
    await createSession(recipientId, keyBundle, this.store);
  }

  /**
   * Check if a session exists with a recipient
   */
  async hasSessionWith(recipientId: string): Promise<boolean> {
    this.ensureInitialized();
    return await hasSession(recipientId, this.store);
  }

  /**
   * Encrypt a message for a recipient
   */
  async encrypt(recipientId: string, message: string, recipientKeyBundle?: KeyBundle): Promise<EncryptedMessage> {
    this.ensureInitialized();
    return await encryptMessage(recipientId, message, this.store, recipientKeyBundle);
  }

  /**
   * Decrypt a message from a sender
   */
  async decrypt(senderId: string, encryptedMessage: EncryptedMessage): Promise<string> {
    this.ensureInitialized();
    return await decryptMessage(senderId, encryptedMessage, this.store);
  }

  /**
   * Delete session with a recipient
   */
  async removeSession(recipientId: string): Promise<void> {
    this.ensureInitialized();
    await deleteSession(recipientId, this.store);
  }

  /**
   * Delete all sessions with a recipient
   */
  async removeAllSessions(recipientId: string): Promise<void> {
    this.ensureInitialized();
    await deleteAllSessions(recipientId, this.store);
  }

  /**
   * Reset all encryption data (use with extreme caution!)
   */
  async reset(): Promise<void> {
    await this.store.clearAll();
    this.initialized = false;
  }

  /**
   * Check if the manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('SignalProtocolManager not initialized. Call initialize() first.');
    }
  }
}

export default SignalProtocolManager.getInstance();
