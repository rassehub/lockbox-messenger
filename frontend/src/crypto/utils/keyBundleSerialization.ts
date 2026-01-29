import { arrayBufferToBase64, base64ToArrayBuffer} from './bufferEncoding'
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