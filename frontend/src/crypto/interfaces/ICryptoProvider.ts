import { EncryptedMessage, KeyBundle, SignedPublicPreKeyType, PreKeyType } from "../types";

export interface ICryptoProvider {
    isNewUser: () => boolean;
    setNewUser: (status: boolean) => void;
    encryptMessage: (recipientUserId: string, message: string) => Promise<EncryptedMessage>;
    decryptMessage: (senderId: string, message: EncryptedMessage) => Promise<string>;

    hasSession: (recipientId: string, deviceId: number) => Promise<boolean>;
    establishSession: (recipientId: string, keyBundle: KeyBundle) => Promise<void>;
    removeSession: (recipientId: string) => Promise<void>;
    removeAllSessions: () => Promise<void>;

    generateKeyBundle: () => Promise<KeyBundle>;
    regenerateSignedPreKey: () => Promise<SignedPublicPreKeyType>;
    regeneratePreKeys: (count: number, excludedIds: number[]) => Promise<PreKeyType[]>;
    cleanLocalPreKeys: (validIds: number[]) => Promise<void>;
    cleanLocalSignedPreKeys: (validIds: number[]) => Promise<void>;
}