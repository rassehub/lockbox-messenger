/**
 * Key Management Integration
 * Combines local key generation (SignalProtocolManager) with server communication (KeyService)
 * This is the main interface for key operations in your app
 */

import { SignalProtocolManager } from './SignalProtocolManager';
import { keyService } from './keyService';
import { SignalKeyBundle, KeyBundle } from './types';
import { arrayBufferToBase64, base64ToArrayBuffer } from './utils';

export class KeyManager {
  private signalManager: SignalProtocolManager;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.signalManager = SignalProtocolManager.getInstance();
  }

  /**
   * Initialize encryption for a new user (after registration)
   * 1. Generate local Signal identity and keys
   * 2. Upload key bundle to server
   */
  async initializeForNewUser(sessionCookie: string): Promise<void> {
    // Set session cookie for server communication
    keyService.setSessionCookie(sessionCookie);
    // Generate local identity
    await this.signalManager.initialize(this.userId);
    
    // Generate key bundle (includes identity key, signed pre-key, and one-time pre-keys)
    const localKeyBundle = await this.signalManager.getKeyBundle();
    
    // Convert to server-compatible format (ArrayBuffer → base64)
    const serverKeyBundle: SignalKeyBundle = this.convertToServerFormat(localKeyBundle);
    // Upload to server
    await keyService.uploadKeyBundle(serverKeyBundle);
  }

  /**
   * Initialize encryption for existing user (on app startup)
   * Loads existing identity from local storage
   */
  async initializeForExistingUser(sessionCookie: string): Promise<void> {
    keyService.setSessionCookie(sessionCookie);
    await this.signalManager.initialize(this.userId);
    
    // Check if keys need replenishment
    await this.checkAndReplenishKeys();
  }

  /**
   * Convert local KeyBundle (with ArrayBuffer) to server format (with base64 strings)
   */
  private convertToServerFormat(localKeyBundle: KeyBundle): SignalKeyBundle {
    return {
      registrationId: localKeyBundle.registrationId,
      identityPubKey: arrayBufferToBase64(localKeyBundle.identityPubKey),
      signedPreKey: {
        keyId: localKeyBundle.signedPreKey.keyId,
        publicKey: arrayBufferToBase64(localKeyBundle.signedPreKey.publicKey),
        signature: arrayBufferToBase64(localKeyBundle.signedPreKey.signature)
      },
      oneTimePreKeys: localKeyBundle.oneTimePreKeys.map(pk => ({
        keyId: pk.keyId,
        publicKey: arrayBufferToBase64(pk.publicKey)
      }))
    };
  }

  /**
   * Convert server KeyBundle (base64 strings) to local format (ArrayBuffer)
   */
  private convertToLocalFormat(serverKeyBundle: SignalKeyBundle): KeyBundle {
    return {
      registrationId: serverKeyBundle.registrationId,
      identityPubKey: base64ToArrayBuffer(serverKeyBundle.identityPubKey),
      signedPreKey: {
        keyId: serverKeyBundle.signedPreKey.keyId,
        publicKey: base64ToArrayBuffer(serverKeyBundle.signedPreKey.publicKey),
        signature: base64ToArrayBuffer(serverKeyBundle.signedPreKey.signature)
      },
      oneTimePreKeys: serverKeyBundle.oneTimePreKeys.map(pk => ({
        keyId: pk.keyId,
        publicKey: base64ToArrayBuffer(pk.publicKey)
      }))
    };
  }

  /**
   * Check if pre-keys are running low and replenish if needed
   * Note: The current SignalProtocolManager doesn't expose individual pre-key generation,
   * so we'll regenerate a full bundle if needed
   */
  async checkAndReplenishKeys(): Promise<void> {
    console.log('hello from checkandreplenish')
    const { needsMorePreKeys, availableCount } = await keyService.checkPreKeys();
    
    if (needsMorePreKeys) {
      console.log(`Pre-keys running low (${availableCount}). Generating more...`);
      
      // Generate new bundle (this is a simplified approach)
      // In production, you'd want more granular control
      const newBundle = await this.signalManager.getKeyBundle();
      const serverBundle = this.convertToServerFormat(newBundle);
      
      // Extract just the new one-time pre-keys
      const preKeysForServer = serverBundle.oneTimePreKeys;
      
      // Upload to server
      const newCount = await keyService.addPreKeys(preKeysForServer);
      console.log(`Pre-keys replenished. New count: ${newCount}`);
    }
  }

  /**
   * Get another user's keys to start a conversation
   * This is called before sending the first message to someone
   */
  async getUserKeysForSession(recipientUserId: string): Promise<void> {
    // Check if session already exists
    const hasSession = await this.signalManager.hasSessionWith(recipientUserId);
    if (hasSession) {
      console.log(`Session with ${recipientUserId} already exists`);
      return;
    }
    
    // Fetch their key bundle from server
    const serverKeyBundle = await keyService.getKeyBundle(recipientUserId);
    
    // Convert from server format to local format
    const localKeyBundle = this.convertToLocalFormat(serverKeyBundle);
    
    // Create local session with their keys
    await this.signalManager.establishSession(recipientUserId, localKeyBundle);
  }

  /**
   * Encrypt a message to send to a recipient
   * Automatically fetches recipient's keys if no session exists
   */
  async encryptMessage(recipientUserId: string, message: string): Promise<{ type: number; body: string }> {
    // Check if we have a session, if not establish one
    const hasSession = await this.signalManager.hasSessionWith(recipientUserId);
    
    if (!hasSession) {
      await this.getUserKeysForSession(recipientUserId);
    }
    
    return await this.signalManager.encrypt(recipientUserId, message);
  }

  /**
   * Decrypt a received message
   */
  async decryptMessage(senderId: string, encryptedMessage: { type: number; body: string; registrationId?: number }): Promise<string> {
    const fullMessage = {
      type: encryptedMessage.type,
      body: encryptedMessage.body,
      registrationId: encryptedMessage.registrationId || 0 // Provide default if not present
    };
    return await this.signalManager.decrypt(senderId, fullMessage);
  }

  /**
   * Rotate signed pre-key (should be done every 30 days)
   * Note: This requires server-side support for updating just the signed pre-key
   */
  async rotateSignedPreKey(): Promise<void> {
    const stats = await keyService.getKeyStatistics();
    
    if (!stats.lastUpdated) {
      console.log('No previous key rotation found');
      return;
    }
    
    const daysSinceUpdate = (Date.now() - new Date(stats.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate > 30) {
      console.log('Rotating signed pre-key...');
      
      // Generate new bundle and extract signed pre-key
      const newBundle = await this.signalManager.getKeyBundle();
      
      // Upload to server
      await keyService.rotateSignedPreKey({
        keyId: newBundle.signedPreKey.keyId,
        publicKey: arrayBufferToBase64(newBundle.signedPreKey.publicKey),
        signature: arrayBufferToBase64(newBundle.signedPreKey.signature)
      });
      
      console.log('Signed pre-key rotated successfully');
    }
  }

  /**
   * Get key statistics from server
   */
  async getKeyStatistics() {
    return await keyService.getKeyStatistics();
  }

  /**
   * Background task to maintain key health
   * Call this periodically (e.g., on app startup or every hour)
   */
  async maintainKeys(): Promise<void> {
    await this.checkAndReplenishKeys();
    await this.rotateSignedPreKey();
  }

  /**
   * Remove session with a user (e.g., for security purposes)
   */
  async removeSession(userId: string): Promise<void> {
    await this.signalManager.removeSession(userId);
  }
}

export default KeyManager;
