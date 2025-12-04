/**
 * Signal Protocol Encryption Service
 * Main export file for the encryption module
 */

// Main manager instance (recommended for most use cases)
import SignalProtocolManagerInstance from './SignalProtocolManager';
export default SignalProtocolManagerInstance;

// Named exports
export { default as SignalProtocolManager } from './SignalProtocolManager';
export { SignalProtocolManager as SignalProtocolManagerClass } from './SignalProtocolManager';

// Server communication and high-level key management
export { KeyManager } from './keyManager';
export { keyService } from './keyService';
export { default as KeyService } from './keyService';

// Storage
export { default as signalStore } from './storage';
export { SignalProtocolStore } from './storage';

// Individual modules (for advanced use cases)
export * from './identity';
export * from './session';
export * from './crypto';
export * from './keys';
export * from './utils';

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
