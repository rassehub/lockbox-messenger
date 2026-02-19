/**
 * Type definitions for Signal Protocol encryption
 */

export interface KeyBundle {
  registrationId: number;
  identityPubKey: ArrayBuffer;
  signedPreKey: SignedPublicPreKeyType;
  oneTimePreKeys: PreKeyType[];
}

export interface SignalProtocolAddressType {
    readonly name: string;
    readonly deviceId: number;
    toString: () => string;
    equals: (other: SignalProtocolAddressType) => boolean;
}

export interface SignalProtocolAddress {
  name: string;
  deviceId: number;
  
  getName(): string;
  getDeviceId(): number;
  toString(): string;
  equals(other: SignalProtocolAddressType): boolean;
}
export interface KeyPairType<T = ArrayBuffer> {
    pubKey: T;
    privKey: T;
}
export interface PreKeyPairType<T = ArrayBuffer> {
    keyId: number;
    keyPair: KeyPairType<T>;
}
export interface SignedPreKeyPairType<T = ArrayBuffer> extends PreKeyPairType<T> {
    signature: T;
}
export interface PreKeyType<T = ArrayBuffer> {
    keyId: number;
    publicKey: T;
}
export interface SignedPublicPreKeyType<T = ArrayBuffer> extends PreKeyType<T> {
    signature: T;
}
export declare type SessionRecordType = string;
export declare enum Direction {
    SENDING = 1,
    RECEIVING = 2
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

export interface KeyStats {
      totalPreKeys: number;
      availablePreKeys: number;
      consumedPreKeys: number;
      lastUpdated: Date;
}

export interface PreKeyCheckResponse {
  needsMorePreKeys: boolean;
  availableCount: number;
  threshold: number;
}
