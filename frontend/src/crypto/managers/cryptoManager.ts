import SignalProtocolStore from '../storage/SignalProtocolStorage';
import { ApiClient } from '../../api/apiClient';
import { checkAndReplenishKeys, rotateSignedPreKey, getUserKeysForSession } from '../services/keys';
import { createUserIdentity, generateKeyBundle, hasUserIdentity, getUserIdentity, } from '../services/identity';
import { createSession, hasSession, deleteSession, deleteAllSessions } from '../services/session';
import { encryptMessage, decryptMessage } from '../services/crypto';

import { SignalKeyBundle, KeyBundle, UserIdentity, EncryptedMessage } from '../types';
import { generatePreKeys } from '../utils/keys';
import { SecureStorage } from 'src/storage/secureStorage';


export class CryptoManager {
    private userId: string;
    private secureStorage: SecureStorage;
    private store: SignalProtocolStore;
    private api: ApiClient;

    private initialized = false;

    constructor(userId: string) {
        this.userId = userId;
        this.secureStorage = new SecureStorage(userId);
        this.store = new SignalProtocolStore(this.secureStorage);
        this.api = new ApiClient(this.secureStorage);
    }

    async initializeNewUser(): Promise<void> {
        await this.initializeLocalIdentity();
        await generateKeyBundle(this.store, this.api);
    }

    async initializeExistingUser(): Promise<void> {
        await this.initializeLocalIdentity();
        await this.maintainKeys();
    }

    private async initializeLocalIdentity(): Promise<UserIdentity> {
        if (this.initialized) {
            const identity = await getUserIdentity(this.store);
            if (identity) {
                return identity;
            }
        }

        const exists = await hasUserIdentity(this.store);
        let identity: UserIdentity;

        if (!exists) {
            identity = await createUserIdentity(this.userId, this.store);
        } else {
            const existingIdentity = await getUserIdentity(this.store);
            if (!existingIdentity) {
                throw new Error('Failed to load user identity');
            }
            identity = existingIdentity;
        }

        this.initialized = true;
        return identity
    }

    async encryptMessage(recipientUserId: string, message: string)
    : Promise<{ type: number; body: string }> {
        this.ensureInitialized();
        const isSession = await hasSession(recipientUserId, this.store);
        if (isSession)
            return await encryptMessage(recipientUserId, message, this.store)

        const recipientKeys = await getUserKeysForSession(recipientUserId, this.api);
        await createSession(recipientUserId, recipientKeys.keyBundle, this.store);

        return await encryptMessage(recipientUserId, message, this.store);
    }

    async decryptMessage(senderId: string, encryptedMessage: { 
        type: number; body: string; registrationId?: number 
    }): Promise<string> {
        this.ensureInitialized();
        const fullMessage = {
            type: encryptedMessage.type,
            body: encryptedMessage.body,
            registrationId: encryptedMessage.registrationId || 0
        };
        return await decryptMessage(senderId, fullMessage, this.store);
    }

    async establishSession(recipientId: string, keyBundle: KeyBundle): Promise<void> {
        this.ensureInitialized();
        await createSession(recipientId, keyBundle, this.store);
    }

    async removeSession(recipientId: string): Promise<void> {
        this.ensureInitialized();
        await deleteSession(recipientId, this.store);
    }

    async maintainKeys(): Promise<void> {
        this.ensureInitialized();
        await checkAndReplenishKeys(this.api, this.store);
        await rotateSignedPreKey(this.api, this.store);
    }

    private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('CryptoManager not initialized. initialize user first');
    }
  }
}