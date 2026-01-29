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

// Server-compatible key bundle (uses base64 strings instead of ArrayBuffer)
export interface SignalKeyBundle {
  registrationId: number;
  identityPubKey: string; // base64 encoded
  signedPreKey: {
    keyId: number;
    publicKey: string; // base64 encoded
    signature: string; // base64 encoded
  };
  oneTimePreKeys: Array<{
    keyId: number;
    publicKey: string; // base64 encoded
  }>;
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
