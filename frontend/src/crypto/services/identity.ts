/**
 * Identity management for Signal Protocol
 * Handles user identity creation and key bundle generation
 */

import { SignalProtocolStore } from '../storage/SignalProtocolStorage';
import {
  generateRegistrationId,
  generateIdentityKeyPair,
  generatePreKey,
  generateSignedPreKey,
  generateKeyId,
  generatePreKeys,
  preKeyArrayToPublic,
  signedPreKeyToPublic
} from '../utils/keys';
import type { UserIdentity, KeyBundle } from '../types';
import type { SignedPublicPreKeyType, PreKeyType, PreKeyPairType, KeyPairType } from '@privacyresearch/libsignal-protocol-typescript';
import { ApiClient } from 'src/api/apiClient';

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
export const generateKeyBundle = async (store: SignalProtocolStore, api: ApiClient): Promise<KeyBundle> => {
  const registrationId = await store.getLocalRegistrationId();
  const identityKeyPair = await store.getIdentityKeyPair();

  if (!registrationId || !identityKeyPair) {
    throw new Error('User identity not initialized. Call createUserIdentity first.');
  }

  const signedPreKeyId = generateKeyId();
  const signedPreKey = await generateSignedPreKey(identityKeyPair, signedPreKeyId);

  // Generate one-time pre-keys 
  const preKeys = await generatePreKeys(generateKeyId(), 100);

  const pubPK = preKeyArrayToPublic(preKeys);
  const pubSPK = await signedPreKeyToPublic(signedPreKeyId, signedPreKey);

  await store.replacePreKeys(preKeys);
  await store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);

  await api.makeRequest("uploadKeyBundle", {
    keyBundle: {
      registrationId,
      identityPubKey: identityKeyPair.pubKey,
      signedPreKey: pubSPK,
      oneTimePreKeys: pubPK,
    }
  })
  
  return {
    registrationId,
    identityPubKey: identityKeyPair.pubKey,
    signedPreKey: pubSPK,
    oneTimePreKeys: pubPK,
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
  count: number = 100
): Promise<PreKeyType[]> => {
  const keyId  = generateKeyId()
  const preKeys = await generatePreKeys(keyId, count);
  await store.replacePreKeys(preKeys);

  const publicPreKeys: PreKeyType[] = [];
  for (const preKey of preKeys) {
    publicPreKeys.push({
      keyId: preKey.keyId,
      publicKey: preKey.keyPair.pubKey,
    });
  }
  return publicPreKeys
};

