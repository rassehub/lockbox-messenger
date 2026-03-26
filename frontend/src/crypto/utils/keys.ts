import { KeyHelper } from '@privacyresearch/libsignal-protocol-typescript';
import type { SignedPublicPreKeyType, PreKeyType, PreKeyPairType, KeyPairType, SignedPreKeyPairType } from '@privacyresearch/libsignal-protocol-typescript';

export const generateKeyId = (): number => {
    return Math.floor(Math.random() * 16777215);
};

export const generateRegistrationId = (): number => {
    return KeyHelper.generateRegistrationId();
};

export const generateIdentityKeyPair = async (): Promise<KeyPairType> => {
    return KeyHelper.generateIdentityKeyPair();
};

export const generatePreKey = async (keyId: number) => {
    return KeyHelper.generatePreKey(keyId);
};

export const generateSignedPreKey = async (identityKeyPair: KeyPairType, keyId: number) => {
    return KeyHelper.generateSignedPreKey(identityKeyPair, keyId);
};

export const preKeyToPublic = async (keyId: number, preKey: PreKeyPairType): Promise<PreKeyType> => ({
    keyId,
    publicKey: preKey.keyPair.pubKey,
});

export const signedPreKeyToPublic = async (keyId: number, signedPreKey: SignedPreKeyPairType): Promise<SignedPublicPreKeyType> => ({
    keyId,
    publicKey: signedPreKey.keyPair.pubKey,
    signature: signedPreKey.signature,
});

export const generatePreKeysFromIds = async (keyIds: number[]): Promise<PreKeyPairType[]> => {
    const preKeys: PreKeyPairType[] = [];
    for (const keyId of keyIds) {
        preKeys.push(await generatePreKey(keyId));
    }
    return preKeys;
};

export const preKeyArrayToPublic = (preKeys: PreKeyPairType[]): PreKeyType[] =>
    preKeys.map(preKey => ({
        keyId: preKey.keyId,
        publicKey: preKey.keyPair.pubKey,
    }));