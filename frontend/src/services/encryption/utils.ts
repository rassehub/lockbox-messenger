/**
 * Utility functions for encryption
 * Helpers for data conversion and encoding
 */

/**
 * Convert ArrayBuffer to Base64 string
 * Used when sending encrypted data over the network
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 * Used when receiving encrypted data from the network
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert string to ArrayBuffer
 * Used when encrypting text messages
 */
export function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

/**
 * Convert ArrayBuffer to string
 * Used when decrypting text messages
 */
export function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

/**
 * Serialize a KeyBundle for network transmission
 */
export function serializeKeyBundle(keyBundle: any): any {
  return {
    registrationId: keyBundle.registrationId,
    identityPubKey: arrayBufferToBase64(keyBundle.identityPubKey),
    signedPreKey: {
      keyId: keyBundle.signedPreKey.keyId,
      publicKey: arrayBufferToBase64(keyBundle.signedPreKey.publicKey),
      signature: arrayBufferToBase64(keyBundle.signedPreKey.signature),
    },
    oneTimePreKeys: keyBundle.oneTimePreKeys.map((key: any) => ({
      keyId: key.keyId,
      publicKey: arrayBufferToBase64(key.publicKey),
    })),
  };
}

/**
 * Deserialize a KeyBundle received from the network
 */
export function deserializeKeyBundle(serialized: any): any {
  return {
    registrationId: serialized.registrationId,
    identityPubKey: base64ToArrayBuffer(serialized.identityPubKey),
    signedPreKey: {
      keyId: serialized.signedPreKey.keyId,
      publicKey: base64ToArrayBuffer(serialized.signedPreKey.publicKey),
      signature: base64ToArrayBuffer(serialized.signedPreKey.signature),
    },
    oneTimePreKeys: serialized.oneTimePreKeys.map((key: any) => ({
      keyId: key.keyId,
      publicKey: base64ToArrayBuffer(key.publicKey),
    })),
  };
}

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
