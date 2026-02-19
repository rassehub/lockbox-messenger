/**
 * Key generation utilities for Signal Protocol
 */

import { KeyHelper } from '@privacyresearch/libsignal-protocol-typescript';
import type { SignedPublicPreKeyType, PreKeyType, PreKeyPairType, KeyPairType, SignedPreKeyPairType } from '@privacyresearch/libsignal-protocol-typescript';

/**
 * Generate a unique key ID
 */
export const generateKeyId = (): number => {
  return Math.floor(Math.random() * 16777215); // 24-bit random number
};

/**
 * Generate a registration ID for the user
 */
export const generateRegistrationId = (): number => {
  return KeyHelper.generateRegistrationId();
};

/**
 * Generate identity key pair
 */
export const generateIdentityKeyPair = async () => {
  return await KeyHelper.generateIdentityKeyPair();
};

/**
 * Generate a pre-key
 */
export const generatePreKey = async (keyId: number) => {
  return await KeyHelper.generatePreKey(keyId);
};

/**
 * Generate a signed pre-key
 */
export const generateSignedPreKey = async (identityKeyPair: any, keyId: number) => {
  return await KeyHelper.generateSignedPreKey(identityKeyPair, keyId);
};

/**
 * strip privateKey from a pre-key
 */
export const preKeyToPublic = async (keyId: number, preKey: PreKeyPairType): Promise<PreKeyType> => {
  return {
    keyId: keyId,
    publicKey: preKey.keyPair.pubKey
  }
};

/**
 * strip privateKey from a signed pre-key
 */
export const signedPreKeyToPublic = async (keyId: number, signedPreKey: SignedPreKeyPairType) : Promise<SignedPublicPreKeyType> => {
   return {
    keyId: keyId,
    publicKey: signedPreKey.keyPair.pubKey,
    signature: signedPreKey.signature
  };
  
};


/**
 * Generate multiple pre-keys at once
 */
export const generatePreKeys = async (startId: number, count: number) => {
  const preKeys = [];
  for (let i = 0; i < count; i++) {
    const preKey = await generatePreKey(startId + i);
    preKeys.push(preKey);
  }
  return preKeys;
};

/**
 * strip privateKey from multiple pre-keys at once
 */
export const preKeyArrayToPublic = (preKeys: PreKeyPairType[]) => {
  const publicPreKeys: PreKeyType[] = [];
    for (const preKey of preKeys) {
      publicPreKeys.push({
        keyId: preKey.keyId,
        publicKey: preKey.keyPair.pubKey,
      });
    }
  return publicPreKeys;
};
