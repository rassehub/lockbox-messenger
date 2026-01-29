import {
  KeyPairType,
} from '@privacyresearch/libsignal-protocol-typescript';

type PreKeyId = string & { readonly __brand: "PreKeyId" };
type SignedPreKeyId = string & { readonly __brand: "SignedPreKeyId" };
type recipientIdentityKeysId = string & { readonly __brand: "recipientIdentityKeysId" };

export type RecordEntries = {
    preKeys: Record<string, KeyPairType>;
    signedPreKeys: Record<string, KeyPairType>;
    recipientIdentityKeys: Record<string, ArrayBuffer>;
    session: Record<string, string>;
}

type ScalarEntries = {
    identityKey: KeyPairType;
    registrationId: number;
    
    //Types for authentication:
    sessionToken: string;
    refreshToken: string;
}

export type SecureStorageSchema =  RecordEntries & ScalarEntries