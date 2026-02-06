import { AuthService } from "../../src/auth/auth";
import { KeyManager } from "../../src/crypto";
import { SignalProtocolManager } from "../../src/crypto/managers/SignalProtocolManager";
import  WebSocketService  from "../../src/realtime/websocket";


describe('The whole user story', () => {
    let authService: AuthService
    let wsService: WebSocketService
    let signalManager: SignalProtocolManager
    let keyManager: KeyManager

    class User {
      username: string;
      phoneNumber: string;
      password: string;
      sessionCookie: string;
      userId: string;
      keyManager: KeyManager | null;
      authService: AuthService;
      wsService: WebSocketService;

      constructor(options?: {
        username?: string;
        phoneNumber?: string;
        password?: string;
        sessionCookie?: string;
        userId?: string;
        keyManager?: KeyManager | null;
      }) {
        const baseUsername = options?.username ?? 'user';    
        this.username = `${baseUsername}_${Date.now()}_${Math.floor(
          Math.random() * 1000
        )}`;
        this.phoneNumber =
          options?.phoneNumber ??
          `+1555${Math.floor(Math.random() * 10000000)
            .toString()
            .padStart(7, '0')}`;

        this.password = options?.password ?? 'secure_password_123';
        this.sessionCookie = options?.sessionCookie ?? '';
        this.userId = options?.userId ?? '';
        this.keyManager = options?.keyManager ?? null;
        this.authService = new AuthService;
        this.wsService = new WebSocketService;
      }
    }

    const alice = new User({username: 'alice'})
    const bob = new User({username: 'bob'})

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

describe('User registration and connection', () => {
    it('Should register and initialize alice correctly: ', async () => {
        const response = await alice.authService.register(
            alice.username,
            alice.phoneNumber,
            alice.password
        );

        expect(response).toBeDefined();
        expect(response.result).toBe('Created');
        expect(response.userId).toBeDefined();

        alice.userId = response.userId
        alice.sessionCookie = alice.authService.getSessionCookie() || '';
        alice.keyManager = new KeyManager(alice.userId);
        await alice.keyManager.initializeForNewUser(alice.sessionCookie);
    });

    it('should connect alice to websocket: ', async () => {
        alice.wsService.connect(alice.sessionCookie)
        await expect(waitForOpen(alice.wsService)).resolves.toBeUndefined();
        alice.wsService.disconnect();
    });

    it('Should register and initialize bob correctly: ', async () => {
        const response = await bob.authService.register(
            bob.username,
            bob.phoneNumber,
            bob.password
        );

        expect(response).toBeDefined();
        expect(response.result).toBe('Created');
        expect(response.userId).toBeDefined();

        bob.userId = response.userId
        bob.sessionCookie = bob.authService.getSessionCookie() || '';
        bob.keyManager = new KeyManager(bob.userId);
        await bob.keyManager.initializeForNewUser(bob.sessionCookie);
    });
    
    it('should verify Alice has encryption keys on server', async () => {
        expect(alice.keyManager).not.toBeNull();
        
        const stats = await alice.keyManager!.getKeyStatistics();
        
        expect(stats).toBeDefined();
        expect(stats.totalPreKeys).toBeGreaterThan(0);
        expect(stats.availablePreKeys).toBeGreaterThan(0);
        
    }, 10000);

    it('should verify Bob has encryption keys on server', async () => {
        expect(bob.keyManager).not.toBeNull();
        
        const stats = await bob.keyManager!.getKeyStatistics();
        
        expect(stats).toBeDefined();
        expect(stats.totalPreKeys).toBeGreaterThan(0);
        expect(stats.availablePreKeys).toBeGreaterThan(0);
        
    }, 10000);
});

describe('message encryption and exhange between users', () => {
    let encryptedMessage: { type: number; body: string };
    const aliceMessage = 'Hello Bob!';
    it('should allow alice to encrypt message for bob: ' , async () => {
        expect(alice.keyManager).not.toBeNull();
        
        encryptedMessage = await alice.keyManager!.encryptMessage(bob.userId, aliceMessage);

        expect(encryptedMessage).toBeDefined();
        expect(encryptedMessage.type).toBeDefined();
        expect(encryptedMessage.body).toBeDefined();
        expect(typeof encryptedMessage.body).toBe('string');
        
        // Encrypted message should be different from original
        expect(encryptedMessage.body).not.toBe(aliceMessage);
    });

    it('should send encrypted message to bob properly: ', async () => {
        alice.wsService.connect(alice.sessionCookie)
        await expect(waitForOpen(alice.wsService)).resolves.toBeUndefined();

        bob.wsService.connect(bob.sessionCookie)
        await expect(waitForOpen(bob.wsService)).resolves.toBeUndefined();
        
        const messagePromise = waitForMessage(bob.wsService)

        alice.wsService.sendMessage(bob.userId, encryptedMessage)

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

        const decryptedMessage = await bob.keyManager!.decryptMessage(received.sender, received.ciphertext);
      
        expect(decryptedMessage).toBeDefined();
        expect(typeof decryptedMessage).toBe('string');
        expect(decryptedMessage).toBe(aliceMessage);   

        alice.wsService.disconnect()
        bob.wsService.disconnect()
    }, 10000);

    it('should receive and decrypt message from cache: ', async () => {
        alice.wsService.connect(alice.sessionCookie)
        await expect(waitForOpen(alice.wsService)).resolves.toBeUndefined();

        const offlineMessage = await alice.keyManager!.encryptMessage(bob.userId, "offline message");

        alice.wsService.sendMessage(bob.userId, offlineMessage)
        alice.wsService.disconnect()

        bob.wsService.connect(bob.sessionCookie)
        await expect(waitForOpen(bob.wsService)).resolves.toBeUndefined();
        
        const messagePromise = waitForMessage(bob.wsService)
        
        const received = await messagePromise;
        
        const expectedMessage = {
            type: offlineMessage.type,
            body: offlineMessage.body,
        }
        expect(received).toMatchObject({
            type: 'MESSAGE',
            sender: alice.userId,
            ciphertext: expectedMessage
        });
        bob.wsService.disconnect()
    });
});
});