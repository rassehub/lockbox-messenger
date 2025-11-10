/**
 * Type definitions for Signal Protocol encryption
 */

import type { KeyPairType, SignedPublicPreKeyType, PreKeyType } from '@privacyresearch/libsignal-protocol-typescript';

export interface KeyBundle {
  registrationId: number;
  identityPubKey: ArrayBuffer;
  signedPreKey: SignedPublicPreKeyType;
  oneTimePreKeys: PreKeyType[];
}

export interface UserIdentity {
  userId: string;
  registrationId: number;
  identityKeyPair: KeyPairType;
}

export interface EncryptedMessage {
  type: number;
  body: string;
  registrationId: number;
}

export interface MessagePayload {
  senderId: string;
  recipientId: string;
  message: string;
  timestamp: number;
}

export interface StoredSession {
  recipientId: string;
  deviceId: number;
}
