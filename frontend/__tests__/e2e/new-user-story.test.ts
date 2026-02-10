import { AuthService } from "../../src/auth/auth";
import { CryptoManager } from "../../src/crypto/managers/cryptoManager";
import { ApiClient } from "../../src/api/apiClient";
import { WebSocketService } from "../../src/realtime/websocket";
import { FetchHttpClient } from "../../src/core/fetchHttpClient";
export interface ClientContext {
  userId: string
  username: string
  phoneNumber: string
  password: string

  transport: FetchHttpClient
  auth: AuthService
  api: ApiClient
  crypto: CryptoManager
  ws: WebSocketService
}


export function createClientContext(): ClientContext {
  const transport = new FetchHttpClient("http://127.0.0.1:3000")
  const auth = new AuthService(transport)
  const api = new ApiClient(auth, transport)
  const crypto = new CryptoManager(api)
  const ws = new WebSocketService(auth)

  return {
    userId: "",
    username: `liisa${Math.floor(Math.random() * 16777215)}`,
    phoneNumber: String(Math.floor(Math.random() * 16777215)),
    password: "notsosecure",

    transport,
    auth,
    api,
    crypto,
    ws
  }
}

const alice = createClientContext();

const bob = createClientContext();
    
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

        const result = await alice.crypto.initializeNewUser(alice.userId);
        expect(result).toBeTruthy;
        const keyStats = await alice.api.makeRequest("fetchMyKeyStatistics");
        expect(keyStats).toBeDefined;
        expect(keyStats.data.availablePreKeys).toBeGreaterThan(1);
    });
    it('initializes cryptomanager for existing user succesully', async () => {

        const result = await alice.crypto.initializeExistingUser(alice.userId);
        expect(result).toBeTruthy;
    });


});
describe('WebSocket and encryption:', () => {
    let encryptedMessage: { type: number; body: string };
    const aliceMessage = 'Hello Bob!';
    const bobMessage = 'Hello Alice!';
    it('should connect alice to websocket', async () => {
        alice.ws.connect();
        await expect(waitForOpen(alice.ws)).resolves.toBeUndefined();
        alice.ws.disconnect();
    });
    it('should connect bob to websocket after registering and initializing bob', async () => {
        const userId = await bob.auth?.register(bob.username, bob.phoneNumber, bob.password);
        if (userId)
            bob.userId = userId;
        const result = await bob.crypto.initializeNewUser(userId);
        expect(result).toBeTruthy;
        const keyStats = await bob.api.makeRequest("fetchMyKeyStatistics");
        expect(keyStats).toBeDefined;
        expect(keyStats.data.availablePreKeys).toBeGreaterThan(1);
        bob.ws.connect();
        await expect(waitForOpen(bob.ws)).resolves.toBeUndefined();
        bob.ws.disconnect();
    });
    it('should encrypt message', async () => {

        if (alice.crypto) {
            encryptedMessage = await alice.crypto.encryptMessage(bob.userId, aliceMessage);

            expect(encryptedMessage).toBeDefined();
            expect(encryptedMessage.type).toBeDefined();
            expect(encryptedMessage.type).toBe(3);
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
            ciphertext: expectedMessage
        });
        expect(received.ciphertext.type).toBe(3);

        const decryptedMessage = await bob.crypto!.decryptMessage(received.sender, received.ciphertext);

        expect(decryptedMessage).toBeDefined();
        expect(typeof decryptedMessage).toBe('string');
        expect(decryptedMessage).toBe(aliceMessage);

        alice.ws.disconnect();
        bob.ws.disconnect();
    });
    it('should encrypt and decrypt following messages properly', async () => {
        if (bob.crypto) {
            encryptedMessage = await bob.crypto.encryptMessage(alice.userId, bobMessage);

            alice.ws.connect();
            await expect(waitForOpen(alice.ws)).resolves.toBeUndefined();

            bob.ws.connect();
            await expect(waitForOpen(bob.ws)).resolves.toBeUndefined();

            const messagePromise = waitForMessage(alice.ws);

            bob.ws.sendMessage(alice.userId, encryptedMessage)

            const received = await messagePromise;
            expect(received.ciphertext.type).toBe(1);

            const decryptedMessage = await alice.crypto!.decryptMessage(received.sender, received.ciphertext);

            expect(decryptedMessage).toBeDefined();
            expect(typeof decryptedMessage).toBe('string');
            expect(decryptedMessage).toBe(bobMessage);

            alice.ws.disconnect();
            bob.ws.disconnect();
        }
    });
});