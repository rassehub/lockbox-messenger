/**
 * Identity management for Signal Protocol
 * Handles user identity creation and key bundle generation
 */

import { SignalProtocolStore } from './storage';
import {
  generateRegistrationId,
  generateIdentityKeyPair,
  generatePreKey,
  generateSignedPreKey,
  generateKeyId,
  generatePreKeys,
} from './keys';
import type { UserIdentity, KeyBundle } from './types';
import type { SignedPublicPreKeyType, PreKeyType } from '@privacyresearch/libsignal-protocol-typescript';

/**
 * Create a new Signal Protocol identity for the user
 * This should be called once when the user first registers
 */
export const createUserIdentity = async (userId: string, store: SignalProtocolStore): Promise<UserIdentity> => {
  // Generate registration ID
  const registrationId = generateRegistrationId();
  await store.storeRegistrationId(registrationId);

  // Generate identity key pair
  const identityKeyPair = await generateIdentityKeyPair();
  await store.storeIdentityKeyPair(identityKeyPair);

  // Generate and store initial pre-keys (100 keys)
  const preKeys = await generatePreKeys(1, 100);
  for (const preKey of preKeys) {
    await store.storePreKey(preKey.keyId, preKey.keyPair);
  }

  // Generate and store signed pre-key
  const signedPreKeyId = generateKeyId();
  const signedPreKey = await generateSignedPreKey(identityKeyPair, signedPreKeyId);
  await store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);

  return {
    userId,
    registrationId,
    identityKeyPair,
  };
};

/**
 * Generate a key bundle to be uploaded to the server
 * This is what other users will fetch to establish a session with you
 */
export const generateKeyBundle = async (store: SignalProtocolStore): Promise<KeyBundle> => {
  const registrationId = await store.getLocalRegistrationId();
  const identityKeyPair = await store.getIdentityKeyPair();

  if (!registrationId || !identityKeyPair) {
    throw new Error('User identity not initialized. Call createUserIdentity first.');
  }

  // Generate a new signed pre-key
  const signedPreKeyId = generateKeyId();
  const signedPreKey = await generateSignedPreKey(identityKeyPair, signedPreKeyId);
  await store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);

  // Create public version of signed pre-key
  const publicSignedPreKey: SignedPublicPreKeyType = {
    keyId: signedPreKeyId,
    publicKey: signedPreKey.keyPair.pubKey,
    signature: signedPreKey.signature,
  };

  // Generate one-time pre-keys (or use existing ones)
  const preKeyId = generateKeyId();
  const preKey = await generatePreKey(preKeyId);
  await store.storePreKey(preKeyId, preKey.keyPair);

  const publicPreKey: PreKeyType = {
    keyId: preKey.keyId,
    publicKey: preKey.keyPair.pubKey,
  };

  return {
    registrationId,
    identityPubKey: identityKeyPair.pubKey,
    signedPreKey: publicSignedPreKey,
    oneTimePreKeys: [publicPreKey],
  };
};

/**
 * Check if user identity exists
 */
export const hasUserIdentity = async (store: SignalProtocolStore): Promise<boolean> => {
  const registrationId = await store.getLocalRegistrationId();
  const identityKeyPair = await store.getIdentityKeyPair();
  return !!(registrationId && identityKeyPair);
};

/**
 * Get the current user's identity information
 */
export const getUserIdentity = async (store: SignalProtocolStore): Promise<UserIdentity | null> => {
  const registrationId = await store.getLocalRegistrationId();
  const identityKeyPair = await store.getIdentityKeyPair();

  if (!registrationId || !identityKeyPair) {
    return null;
  }

  return {
    userId: 'current-user', // You'll need to get this from your auth context
    registrationId,
    identityKeyPair,
  };
};

/**
 * Regenerate pre-keys when running low
 * Should be called periodically or when the server notifies you're running low
 */
export const regeneratePreKeys = async (
  store: SignalProtocolStore,
  startId: number,
  count: number = 100
): Promise<void> => {
  const preKeys = await generatePreKeys(startId, count);
  for (const preKey of preKeys) {
    await store.storePreKey(preKey.keyId, preKey.keyPair);
  }
};
