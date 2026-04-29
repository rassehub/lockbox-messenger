import { ICryptoProvider } from "../interfaces/ICryptoProvider";
import { IKeyApiService } from "../interfaces/IKeyApiService";
import { EncryptedMessage, KeyBundle } from "../types";

const PREKEY_TARGET = 100;

export class CryptoManager {
    private crypto: ICryptoProvider;
    private api: IKeyApiService;

    private constructor(crypto: ICryptoProvider, api: IKeyApiService, maintainsKeys: boolean) {
        this.crypto = crypto;
        this.api = api;
        if (maintainsKeys)
            this.maintainKeys();
    }

    static async initializeUser(crypto: ICryptoProvider, api: IKeyApiService): Promise<CryptoManager> {
        if (crypto.isNewUser()) {
            const keyBundle = await crypto.generateKeyBundle();
            await api.uploadKeyBundle(keyBundle);
            crypto.setNewUser(false);
            return new CryptoManager(crypto, api, false);
        }
        return new CryptoManager(crypto, api, true);
    }

    async encryptMessage(recipientId: string, message: string): Promise<EncryptedMessage> {
        const isSession = await this.crypto.hasSession(recipientId, 1);
        if (!isSession) {
            const reKeyBundle = await this.api.fetchRecipientKeyBundle(recipientId);
            await this.crypto.establishSession(recipientId, reKeyBundle);
        }
        return this.crypto.encryptMessage(recipientId, message);
    }

    async decryptMessage(senderId: string, encryptedMessage: EncryptedMessage): Promise<string> {
        return this.crypto.decryptMessage(senderId, encryptedMessage);
    }

    async removeSession(recipientId: string): Promise<void> {
        await this.crypto.removeSession(recipientId);
    }

    async removeAllSessions(): Promise<void> {
        await this.crypto.removeAllSessions();
    }

    async maintainKeys(): Promise<void> {
        const stats = await this.api.getKeyStatistics();

        // Remove local prekeys that server no longer tracks
        await this.crypto.cleanLocalPreKeys(stats.validPreKeyIds);

        // Remove local signed prekeys not referenced by server (current, previous, expired)
        const validSignedIds = [
            stats.signedPreKey.keyId,
            stats.previousSignedPKID,
            stats.expiredSignedPKID,
        ].filter((id): id is number => id !== undefined);
        await this.crypto.cleanLocalSignedPreKeys(validSignedIds);

        // Replenish prekeys — exclude IDs already on server to guarantee uniqueness
        if (stats.availablePreKeys < PREKEY_TARGET) {
            const count = PREKEY_TARGET - stats.availablePreKeys;
            const newPreKeys = await this.crypto.regeneratePreKeys(count, stats.validPreKeyIds);
            await this.api.uploadPreKeys(newPreKeys);
        }

        // Rotate signed prekey if server flags it as needed
        if (stats.signedPreKey.needsRotation) {
            const signedPreKey = await this.crypto.regenerateSignedPreKey();
            await this.api.rotateSignedPreKey(signedPreKey);
        }
    }
}