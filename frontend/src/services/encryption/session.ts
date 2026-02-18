/**
 * Session management for Signal Protocol
 * Handles establishing and managing encrypted sessions with other users
 */

import {
  SessionBuilder,
  SessionCipher,
  SignalProtocolAddress,
} from '@privacyresearch/libsignal-protocol-typescript';
import { SignalProtocolStore } from './storage';
import type { KeyBundle } from './types';
import type { DeviceType } from '@privacyresearch/libsignal-protocol-typescript/lib/session-types';

/**
 * Create a session with a recipient using their key bundle
 * This is called when you want to send a message to someone for the first time
 */
export const createSession = async (
  recipientId: string,
  keyBundle: KeyBundle,
  store: SignalProtocolStore,
  deviceId: number = 1
): Promise<void> => {
  const address = new SignalProtocolAddress(recipientId, deviceId);
  const sessionBuilder = new SessionBuilder(store, address);

  // Create DeviceType from the received KeyBundle
  const device: DeviceType = {
    registrationId: keyBundle.registrationId,
    identityKey: keyBundle.identityPubKey,
    signedPreKey: keyBundle.signedPreKey,
    preKey: keyBundle.oneTimePreKeys[0],
  };

  // Process the pre-key bundle to establish the session
  await sessionBuilder.processPreKey(device);
};

/**
 * Check if a session exists with a recipient
 */
export const hasSession = async (
  recipientId: string,
  store: SignalProtocolStore,
  deviceId: number = 1
): Promise<boolean> => {
  const address = new SignalProtocolAddress(recipientId, deviceId);
  const sessionIdentifier = store.getSessionIdentifier(address);
  const session = await store.loadSession(sessionIdentifier);
  return !!session;
};

/**
 * Delete a session with a recipient
 */
export const deleteSession = async (
  recipientId: string,
  store: SignalProtocolStore,
  deviceId: number = 1
): Promise<void> => {
  const address = new SignalProtocolAddress(recipientId, deviceId);
  const sessionIdentifier = store.getSessionIdentifier(address);
  await store.removeSession(sessionIdentifier);
};

/**
 * Delete all sessions with a recipient (all devices)
 */
export const deleteAllSessions = async (
  recipientId: string,
  store: SignalProtocolStore
): Promise<void> => {
  await store.removeAllSessions(recipientId);
};

/**
 * Get the session cipher for encryption/decryption
 */
export const getSessionCipher = (
  recipientId: string,
  store: SignalProtocolStore,
  deviceId: number = 1
): SessionCipher => {
  const address = new SignalProtocolAddress(recipientId, deviceId);
  return new SessionCipher(store, address);
};
