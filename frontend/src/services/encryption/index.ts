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
 * // PRODUCTION: Default import (easiest - recommended)
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
