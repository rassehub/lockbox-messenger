import { KeyPairType, SessionRecordType, Direction, PreKeyPairType, SignalProtocolAddress } from "../types";

export interface ICryptoStorage {
    getIdentityKeyPair: () => Promise<KeyPairType | undefined>;
    getLocalRegistrationId: () => Promise<number | undefined>;
    isTrustedIdentity: (identifier: string, identityKey: ArrayBuffer, direction: Direction) => Promise<boolean>;
    saveIdentity: (encodedAddress: string, publicKey: ArrayBuffer, nonblockingApproval?: boolean) => Promise<boolean>;
    loadPreKey: (encodedAddress: string | number) => Promise<KeyPairType | undefined>;
    storePreKey: (keyId: number | string, keyPair: KeyPairType) => Promise<void>;
    removePreKey: (keyId: number | string) => Promise<void>;
    storeSession: (encodedAddress: string, record: SessionRecordType) => Promise<void>;
    loadSession: (encodedAddress: string) => Promise<SessionRecordType | undefined>;
    loadSignedPreKey: (keyId: number | string) => Promise<KeyPairType | undefined>;
    storeSignedPreKey: (keyId: number | string, keyPair: KeyPairType) => Promise<void>;
    removeSignedPreKey: (keyId: number | string) => Promise<void>;


    storePreKeys: (preKeys: {keyId: string | number, keyPair: KeyPairType}[]) => Promise<void>
    storeIdentityKeyPair: (keyPair: KeyPairType) => Promise<void>
    storeLocalRegistrationId: (registrationId: number) => Promise<void>
    storeSignedPreKeyId: (keyId: number) => Promise<void>
    removeAllSessions: () => Promise<void>
    replacePreKeys: (keyPairs: PreKeyPairType[]) => Promise<void>
    removeSession: (identifier: string) => Promise<void>
    clearAll: () => Promise<void>

    getSessionIdentifier: (address: SignalProtocolAddress) => string
    loadIdentityKey: (identifier: string) => Promise<ArrayBuffer | undefined>
    loadSignedPreKeyId: () => Promise<number | undefined>
    loadAllPreKeys: () => Promise<PreKeyPairType[] | undefined>

    //arrayBuffersEqual: () => Promise<void>
}