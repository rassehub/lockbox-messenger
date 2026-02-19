import { ICryptoProvider } from "../interfaces/ICryptoProvider"
import { IKeyApiService } from "../interfaces/IKeyApiService"
import { EncryptedMessage, KeyBundle, UserIdentity } from "../types"

//handles cryptography and key related server communication using crypto-provider and key-api-service
export class CryptoManager {
    private crypto: ICryptoProvider;
    private api: IKeyApiService;

    private constructor(
        crypto: ICryptoProvider,
        api: IKeyApiService,
        maintainsKeys: boolean,
    ) {
        this.crypto = crypto;
        this.api = api;
        if(maintainsKeys)
            this.maintainKeys();
    };

    static async initializeUser(
        crypto: ICryptoProvider,
        api: IKeyApiService,
    ): Promise<CryptoManager> {
        let keyBundle: KeyBundle;

        const newUser = crypto.isNewUser();

        if (newUser) {
            keyBundle = await crypto.generateKeyBundle()
            await api.uploadKeyBundle(keyBundle);
            crypto.setNewUser(false);
            return new CryptoManager(crypto, api, false);
        } else
            return new CryptoManager(crypto, api, true);
    }

    async encryptMessage(recipientId: string, message: string): Promise<EncryptedMessage> {
        const isSession = await this.crypto.hasSession(recipientId, 1)
        if (!isSession) {
            const reKeyBundle = await this.api.fetchRecipientKeyBundle(recipientId);
            await this.crypto.establishSession(recipientId, reKeyBundle);
        }
        const encryptedMessage = await this.crypto.encryptMessage(recipientId, message);
        return encryptedMessage;
    };

    async decryptMessage(senderId: string, encryptedMessage: EncryptedMessage): Promise<string> {
        const message = await this.crypto.decryptMessage(senderId, encryptedMessage);
        return message;
    };

    async removeSession(recipientId: string): Promise<void> {
        await this.crypto.removeSession(recipientId);
    };

    async removeAllSessions(): Promise<void> {
        await this.crypto.removeAllSessions();
    };

    async maintainKeys(): Promise<void> {
        const preKeyAvailability = await this.api.checkPreKeys();
        const keyStats = await this.api.getKeyStats();

        //check if prekeys are running low
        if (preKeyAvailability.needsMorePreKeys) {
            const preKeys = await this.crypto.regeneratePreKeys(100 - preKeyAvailability.availableCount);
            await this.api.uploadPreKeys(preKeys);
        }

        //check if signed prekey needs to be updated
        const daysSinceUpdate = (Date.now() - new Date(keyStats.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate > 30) {
            const signedPreKey = await this.crypto.regenerateSignedPreKey();
            await this.api.rotateSignedPreKey(signedPreKey);
        }
    };
}