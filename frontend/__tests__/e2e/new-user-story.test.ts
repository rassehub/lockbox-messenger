import { AuthService } from "../../src/auth/auth";
import { CryptoManager } from "../../src/crypto/managers/cryptoManager";
import { ApiClient } from "../../src/api/apiClient";
import { WebSocketService } from "../../src/realtime/websocket";

const alice = {
    userId: "",
    username: `liisa${Math.floor(Math.random() * 16777215)}`,
    phoneNumber: String(Math.floor(Math.random() * 16777215)),
    password: "notsosecure",
    api: new ApiClient(),
    auth: undefined as AuthService | undefined,
    crypto: undefined as CryptoManager | undefined,
    ws: new WebSocketService()
}
alice.auth = new AuthService(alice.api, alice.ws);

const bob = {
    userId: "",
    username: `bob${Math.floor(Math.random() * 16777215)}`,
    phoneNumber: String(Math.floor(Math.random() * 16777215)),
    password: "notsosecure",
    api: new ApiClient(),
    auth: undefined as AuthService | undefined,
    crypto: undefined as CryptoManager | undefined,
    ws: new WebSocketService()
}
bob.auth = new AuthService(bob.api, bob.ws);

const waitForOpen = (ws: WebSocketService): Promise<void> => {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
        ws.once('open', () => {
            clearTimeout(timeout);
            resolve();
        });
        ws.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });
    });
};

const waitForMessage = (ws: WebSocketService): Promise<any> => {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Message timeout')), 10000);
        ws.onMessage((message) => {
            clearTimeout(timeout);
            resolve(message)
        });
    });
};

describe('Authentication related functions and api-calls', () => {
    it('registers successfully', async () => {
        const userId = await alice.auth?.register(alice.username, alice.phoneNumber, alice.password);
        expect(userId).toBeDefined;
    });
    it('is logged in after registering', async () => {
        const userId = await alice.auth?.getMe();
        expect(userId).toBeDefined;
    });
    it('logs out succesfully', async () => {
        const res = await alice.auth?.logout();
        //const userId = await alice.auth?.getMe();
        //expect(userId).toBeUndefined;
    });
    it('logs back in succcesfully', async () => {
        const userId = await alice.auth?.login(alice.phoneNumber, alice.password);
        expect(userId).toBeDefined;
        const fetchedUserId = await alice.auth?.getMe();
        expect(fetchedUserId).toBeDefined;
        if (userId)
            alice.userId = userId;
    });
    it('initializes cryptomanager for new user succesfully', async () => {
        alice.crypto = new CryptoManager(alice.userId, alice.api)
        const result = await alice.crypto.initializeNewUser();
        expect(result).toBeTruthy;
        const keyStats = await alice.api.makeRequest("fetchMyKeyStatistics");
        expect(keyStats).toBeDefined;
        expect(keyStats.data.availablePreKeys).toBeGreaterThan(1);
    });
    it('initializes cryptomanager for existing user succesully', async () => {
        alice.crypto = new CryptoManager(alice.userId, alice.api);
        const result = await alice.crypto.initializeExistingUser();
        expect(result).toBeTruthy;
    });


});
describe('WebSocket and encryption:', () => {
    let encryptedMessage: { type: number; body: string };
    const aliceMessage = 'Hello Bob!';

    it('should connect alice to websocket', async () => {
        alice.ws.connect();
        await expect(waitForOpen(alice.ws)).resolves.toBeUndefined();
        alice.ws.disconnect();
    });
    it('should connect bob to websocket after registering and initializing bob', async () => {
        const userId = await bob.auth?.register(bob.username, bob.phoneNumber, bob.password);
        if (userId)
            bob.userId = userId;
        bob.crypto = new CryptoManager(bob.userId, bob.api);
        const result = await bob.crypto.initializeNewUser();
        expect(result).toBeTruthy;
        const keyStats = await bob.api.makeRequest("fetchMyKeyStatistics");
        expect(keyStats).toBeDefined;
        expect(keyStats.data.availablePreKeys).toBeGreaterThan(1);
        bob.ws.connect();
        await expect(waitForOpen(bob.ws)).resolves.toBeUndefined();
        bob.ws.disconnect();
    });
    it('should encrypt message', async () => {

        if(alice.crypto) {
            encryptedMessage = await alice.crypto.encryptMessage(bob.userId, aliceMessage);
        
            expect(encryptedMessage).toBeDefined();
            expect(encryptedMessage.type).toBeDefined();
            expect(encryptedMessage.body).toBeDefined();
            expect(typeof encryptedMessage.body).toBe('string');
            
            // Encrypted message should be different from original
            expect(encryptedMessage.body).not.toBe(aliceMessage);
        }
    });
    it('should transfer encrypted message, and decrypt it', async () => {
        alice.ws.connect();
        await expect(waitForOpen(alice.ws)).resolves.toBeUndefined();

        bob.ws.connect();
        await expect(waitForOpen(bob.ws)).resolves.toBeUndefined();
        
        const messagePromise = waitForMessage(bob.ws);

        alice.ws.sendMessage(bob.userId, encryptedMessage)

        const received = await messagePromise;
        const expectedMessage = {
            type: encryptedMessage.type,
            body: encryptedMessage.body,
        }
        expect(received).toMatchObject({
            type: 'MESSAGE',
            sender: alice.userId,
            ciphertext : expectedMessage
        });

        const decryptedMessage = await bob.crypto!.decryptMessage(received.sender, received.ciphertext);
      
        expect(decryptedMessage).toBeDefined();
        expect(typeof decryptedMessage).toBe('string');
        expect(decryptedMessage).toBe(aliceMessage);   

        alice.ws.disconnect();
        bob.ws.disconnect();
    });
});