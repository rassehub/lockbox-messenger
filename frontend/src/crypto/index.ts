/**
 * Signal Protocol Encryption Service
 * Main export file for the encryption module
 */

// Main manager instance (recommended for most use cases)
import SignalProtocolManagerInstance from './managers/SignalProtocolManager';
export default SignalProtocolManagerInstance;

// Named exports
export { default as SignalProtocolManager } from './managers/SignalProtocolManager';
export { SignalProtocolManager as SignalProtocolManagerClass } from './managers/SignalProtocolManager';

// Server communication and high-level key management
export { KeyManager } from './managers/keyManager';
export { keyService } from './services/keyService';
export { default as KeyService } from './services/keyService';

// Storage
export { default as signalStore } from './storage/SignalProtocolStorage';
export { SignalProtocolStore } from './storage/SignalProtocolStorage';

// Individual modules (for advanced use cases)
export * from './services/identity';
export * from './services/session';
export * from './services/crypto';
export * from './utils/keys';
export * from './utils/bufferEncoding';
export * from './utils/keyBundleSerialization';
export * from './utils/identityUtils';

// Types
export * from './types';

/**
 * Usage Example:
 * 
 * // RECOMMENDED: Use KeyManager for integrated server + local encryption
 * import { KeyManager } from '@/services/encryption';
 * const keyManager = new KeyManager(userId);
 * await keyManager.initializeForNewUser(sessionCookie);
 * const encrypted = await keyManager.encryptMessage(recipientId, 'Hello!');
 * 
 * // PRODUCTION: Default import for local-only encryption
 * import encryption from '@/services/encryption';
 * await encryption.initialize(userId);
 * const encrypted = await encryption.encrypt(recipientId, 'Hello!');
 * 
 * // TESTING: Create separate instances for multiple users
 * import { SignalProtocolManagerClass } from '@/services/encryption';
 * const alice = SignalProtocolManagerClass.createTestInstance();
 * const bob = SignalProtocolManagerClass.createTestInstance();
 * await alice.initialize('alice');
 * await bob.initialize('bob');
 * 
 * // TESTING: Reset singleton between tests
 * beforeEach(() => {
 *   SignalProtocolManagerClass.resetInstance();
 * });
 */
