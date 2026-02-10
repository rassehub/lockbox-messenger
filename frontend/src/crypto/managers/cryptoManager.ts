import SignalProtocolStore from '../storage/SignalProtocolStorage';
import { ApiClient } from '../../api/apiClient';
import { createApiFacade } from '../../utils/createApiFacade';
import { checkAndReplenishKeys, rotateSignedPreKey, getUserKeysForSession } from '../services/keys';
import { createUserIdentity, generateKeyBundle, hasUserIdentity, getUserIdentity, } from '../services/identity';
import { createSession, hasSession, deleteSession, deleteAllSessions } from '../services/session';
import { encryptMessage, decryptMessage } from '../services/crypto';

import { KeyBundle, UserIdentity } from '../types';

export class CryptoManager {
    private userId: string  = "";
    private store: SignalProtocolStore | undefined = undefined;
    private api: ReturnType<typeof createApiFacade>;

    private initialized = false;

    constructor(api: ApiClient) {
        
        this.api = createApiFacade([
            "addPreKeys",
            "checkPreKeyAvailability",
            "fetchMyKeyStatistics",
            "fetchRecipientKeyBundle",
            "rotateSignedPreKey",
            "uploadKeyBundle"
        ] as const, api);
    }

    async initializeNewUser(userId: string): Promise<boolean> {
        this.userId = userId;
        this.store = new SignalProtocolStore(userId);
        const identity = await this.initializeLocalIdentity(this.store);
        const keyBundle = await generateKeyBundle(this.store, this.api);
        if(identity && keyBundle)
            return true
        else
            return false
    }

    async initializeExistingUser(userId: string): Promise<boolean> {
        this.userId = userId;
        this.store = new SignalProtocolStore(userId);
        const identity = await this.initializeLocalIdentity(this.store);
        await this.maintainKeys();
        if(identity)
            return true;
        return false;
    }

    private async initializeLocalIdentity(store: SignalProtocolStore): Promise<UserIdentity> {
        if (this.initialized) {
            const identity = await getUserIdentity(store);
            if (identity) {
                return identity;
            }
        }

        const exists = await hasUserIdentity(store);
        let identity: UserIdentity;

        if (!exists) {
            identity = await createUserIdentity(this.userId, store);
        } else {
            const existingIdentity = await getUserIdentity(store);
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
        this.ensureInitialized(); if(!this.store){throw Error('user  not initialized');}
        const isSession = await hasSession(recipientUserId, this.store);
        if (isSession)
            return await encryptMessage(recipientUserId, message, this.store)

        const recipientKeys = await getUserKeysForSession(recipientUserId, this.api);
        await createSession(recipientUserId, recipientKeys.data.keyBundle, this.store);

        return await encryptMessage(recipientUserId, message, this.store);
    }

    async decryptMessage(senderId: string, encryptedMessage: { 
        type: number; body: string; registrationId?: number 
    }): Promise<string> {
        this.ensureInitialized(); if(!this.store){throw Error('user  not initialized');}
        const fullMessage = {
            type: encryptedMessage.type,
            body: encryptedMessage.body,
            registrationId: encryptedMessage.registrationId || 0
        };
        return await decryptMessage(senderId, fullMessage, this.store);
    }

    async establishSession(recipientId: string, keyBundle: KeyBundle): Promise<void> {
        this.ensureInitialized(); if(!this.store){throw Error('user  not initialized');}
        await createSession(recipientId, keyBundle, this.store);
    }

    async removeSession(recipientId: string): Promise<void> {
        this.ensureInitialized(); if(!this.store){throw Error('user  not initialized');}
        await deleteSession(recipientId, this.store);
    }

    async maintainKeys(): Promise<{keysAdded: number, isRotated: boolean}> {
        this.ensureInitialized(); if(!this.store){throw Error('user  not initialized');}
        const keysAdded = await checkAndReplenishKeys(this.api, this.store);
        const isRotated = await rotateSignedPreKey(this.api, this.store);
        return {keysAdded, isRotated};
    }

    private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('CryptoManager not initialized. initialize user first');
    }
  }
}