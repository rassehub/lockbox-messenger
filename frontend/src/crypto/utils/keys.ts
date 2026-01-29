/**
 * Key generation utilities for Signal Protocol
 */

import { KeyHelper } from '@privacyresearch/libsignal-protocol-typescript';

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
