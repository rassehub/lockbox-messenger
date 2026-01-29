import { arrayBufferToBase64} from './bufferEncoding'

/**
 * Generate a fingerprint for identity verification
 * This creates a human-readable hash of an identity key
 */
export function generateFingerprint(identityKey: ArrayBuffer, userId: string): string {
  // Simple implementation - in production use proper fingerprint generation
  const base64 = arrayBufferToBase64(identityKey);
  const hash = Array.from(base64)
    .map(c => c.charCodeAt(0))
    .reduce((a, b) => ((a << 5) - a) + b, 0);
  
  return `${userId.substring(0, 4)}-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

/**
 * Compare two identity keys for equality
 */
export function compareIdentityKeys(key1: ArrayBuffer, key2: ArrayBuffer): boolean {
  const bytes1 = new Uint8Array(key1);
  const bytes2 = new Uint8Array(key2);
  
  if (bytes1.length !== bytes2.length) {
    return false;
  }
  
  for (let i = 0; i < bytes1.length; i++) {
    if (bytes1[i] !== bytes2[i]) {
      return false;
    }
  }
  
  return true;
}
