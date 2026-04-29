import type { EncryptedMessage, KeyBundle, UserIdentity, SignedPublicPreKeyType, PreKeyType, KeyPairType } from "../types";
import { ICryptoStorage } from "../interfaces/ICryptoStorage";
import { ICryptoProvider } from "../interfaces/ICryptoProvider";
import * as utils from '../utils/index';

import type { DeviceType } from '@privacyresearch/libsignal-protocol-typescript/lib/session-types';
import {
    SessionBuilder,
    SessionCipher,
    SignalProtocolAddress,
} from '@privacyresearch/libsignal-protocol-typescript';

export class CryptoProvider implements ICryptoProvider {
    private identity: UserIdentity;
    private newUser: boolean;

    private constructor(private storage: ICryptoStorage, identity: UserIdentity, newUser: boolean) {
        this.identity = identity;
        this.newUser = newUser;
    }

    static async initializeLocalIdentity(storage: ICryptoStorage, userId: string): Promise<CryptoProvider> {
        let registrationId: number | undefined;
        let identityKeyPair: KeyPairType | undefined;
        let newUser: boolean;

        registrationId = await storage.getLocalRegistrationId();
        identityKeyPair = await storage.getIdentityKeyPair();

        if (!registrationId || !identityKeyPair) {
            registrationId = utils.keys.generateRegistrationId();
            identityKeyPair = await utils.keys.generateIdentityKeyPair();

            await storage.storeLocalRegistrationId(registrationId);
            await storage.storeIdentityKeyPair(identityKeyPair);

            newUser = true;
        } else {
            newUser = false;
        }

        const identity: UserIdentity = { userId, registrationId, identityKeyPair };
        return new CryptoProvider(storage, identity, newUser);
    }

    isNewUser(): boolean {
        return this.newUser;
    }

    setNewUser(status: boolean): void {
        this.newUser = status;
    }

    async encryptMessage(recipientId: string, message: string): Promise<EncryptedMessage> {
        const sessionExists = await this.hasSession(recipientId);
        if (!sessionExists)
            throw new Error(`No session exists with ${recipientId}. Please establish a session.`);

        const cipher = this.getSessionCipher(recipientId);
        const messageBuffer = utils.buffer.stringToArrayBuffer(message);
        const ciphertext = await cipher.encrypt(messageBuffer);
        const registrationId = await this.storage.getLocalRegistrationId();

        return {
            type: ciphertext.type,
            body: ciphertext.body || '',
            registrationId: registrationId || 0,
        };
    }

    async decryptMessage(senderId: string, encryptedMessage: EncryptedMessage): Promise<string> {
        const cipher = this.getSessionCipher(senderId);
        let plaintext: ArrayBuffer;

        if (encryptedMessage.type === 3) {
            plaintext = await cipher.decryptPreKeyWhisperMessage(encryptedMessage.body);
        } else if (encryptedMessage.type === 1) {
            plaintext = await cipher.decryptWhisperMessage(encryptedMessage.body);
        } else {
            throw new Error(`Unknown message type: ${encryptedMessage.type}`);
        }

        return utils.buffer.arrayBufferToString(plaintext);
    }

    private getSessionCipher(recipientId: string) {
        const address = new SignalProtocolAddress(recipientId, 1);
        return new SessionCipher(this.storage, address);
    }

    async hasSession(recipientId: string): Promise<boolean> {
        const address = new SignalProtocolAddress(recipientId, 1);
        const sessionIdentifier = this.storage.getSessionIdentifier(address);
        const session = await this.storage.loadSession(sessionIdentifier);
        return !!session;
    }

    async establishSession(recipientId: string, keyBundle: KeyBundle): Promise<void> {
        const address = new SignalProtocolAddress(recipientId, 1);
        const sessionBuilder = new SessionBuilder(this.storage, address);

        const device: DeviceType = {
            registrationId: keyBundle.registrationId,
            identityKey: keyBundle.identityPubKey,
            signedPreKey: keyBundle.signedPreKey,
            preKey: keyBundle.oneTimePreKeys[0],
        };

        await sessionBuilder.processPreKey(device);
    }

    async removeSession(recipientId: string): Promise<void> {
        const address = new SignalProtocolAddress(recipientId, 1);
        const sessionIdentifier = this.storage.getSessionIdentifier(address);
        await this.storage.removeSession(sessionIdentifier);
    }

    async removeAllSessions(): Promise<void> {
        await this.storage.removeAllSessions();
    }

    async generateKeyBundle(): Promise<KeyBundle> {
        const pubSPK = await this.regenerateSignedPreKey();
        const pubPK = await this.regeneratePreKeys(100, []);
        return {
            registrationId: this.identity.registrationId,
            identityPubKey: this.identity.identityKeyPair.pubKey,
            signedPreKey: pubSPK,
            oneTimePreKeys: pubPK,
        };
    }

    async regenerateSignedPreKey(): Promise<SignedPublicPreKeyType> {
        const signedPreKeyId = utils.keys.generateKeyId();
        const signedPreKey = await utils.keys.generateSignedPreKey(this.identity.identityKeyPair, signedPreKeyId);

        await this.storage.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);
        await this.storage.storeSignedPreKeyId(signedPreKeyId);

        return utils.keys.signedPreKeyToPublic(signedPreKeyId, signedPreKey);
    }

    async regeneratePreKeys(count: number, excludedIds: number[]): Promise<PreKeyType[]> {
        const excluded = new Set(excludedIds);
        const idsToUse: number[] = [];
        let candidate = 1;

        while (idsToUse.length < count) {
            if (!excluded.has(candidate))
                idsToUse.push(candidate);
            candidate++;
        }

        const preKeys = await utils.keys.generatePreKeysFromIds(idsToUse);
        await this.storage.storePreKeys(preKeys);

        return utils.keys.preKeyArrayToPublic(preKeys);
    }

    async cleanLocalPreKeys(validIds: number[]): Promise<void> {
        const localPreKeys = await this.storage.loadAllPreKeys();
        if (!localPreKeys) return;

        const validSet = new Set(validIds);
        for (const key of localPreKeys) {
            if (!validSet.has(key.keyId))
                await this.storage.removePreKey(key.keyId);
        }
    }

    async cleanLocalSignedPreKeys(validIds: number[]): Promise<void> {
        const localSignedPreKeys = await this.storage.loadAllSignedPreKeys();
        if (!localSignedPreKeys) return;

        const validSet = new Set(validIds);
        for (const key of localSignedPreKeys) {
            if (!validSet.has(key.keyId))
                await this.storage.removeSignedPreKey(key.keyId);
        }
    }
}