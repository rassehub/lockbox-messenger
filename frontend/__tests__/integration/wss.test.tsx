import { WebSocket } from 'ws'; // or use native WebSocket if available
import { AuthService } from '../../src/auth/auth';

const WS_URL = 'ws://127.0.0.1:3000';
const API_BASE = 'http://127.0.0.1:3000';

describe('WebSocket Integration', () => {
  let authService: AuthService;

  beforeAll(async () => {
    authService = new AuthService();
  });

  afterEach(() => {
    // Clean up any open connections
  });

  const waitForOpen = (ws: WebSocket): Promise<void> => {
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

  const waitForMessage = (ws: WebSocket): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Message timeout')), 5000);
      ws.once('message', (data) => {
        clearTimeout(timeout);
        resolve(JSON.parse(data.toString()));
      });
    });
  };

  describe('Connection', () => {
    it('rejects unauthenticated connections', async () => {
      const ws = new WebSocket(WS_URL);

      await expect(
        new Promise((resolve, reject) => {
          ws.once('error', resolve); // Expecting error
          ws.once('open', () => reject(new Error('Should not connect')));
        })
      ).resolves.toBeDefined();
    });

it('accepts authenticated connections', async () => {
  const username = `ws_${Date.now()}`;
  const phoneNumber = `User ${Date.now()}`;
  const password = 'password123';

  await authService.register(username, phoneNumber, password);
  const loginResult = await authService.login(phoneNumber, password);

  // Use the returned cookie
  const ws = new WebSocket(WS_URL, {
    headers: { Cookie: loginResult.sessionCookie }
  });

  await expect(waitForOpen(ws)).resolves.toBeUndefined();
  ws.close();
});
  });

  describe('Message Handling', () => {
    it('sends and receives messages between connected clients', async () => {
      // Create two users
      const sender = `sender_${Date.now()}`;
      const recipient = `recipient_${Date.now()}`;
      const senderPhoneNumber = `senderphone_queue_${Date.now()}`;
      const recipientPhoneNumber = `recipientphone_queue_${Date.now()}`;

      await authService.register(sender, senderPhoneNumber, 'pw');
      await authService.register(recipient, recipientPhoneNumber, 'pw');

      const senderAuth = await authService.login(senderPhoneNumber, 'pw');
      const recipientAuth = await authService.login(recipientPhoneNumber, 'pw');

      // Connect both via WebSocket
      const senderWs = new WebSocket(WS_URL, {
       headers: { Cookie: senderAuth.sessionCookie }
      });
      const recipientWs = new WebSocket(WS_URL, {
        headers: { Cookie: recipientAuth.sessionCookie }
      });

      await waitForOpen(senderWs);
      await waitForOpen(recipientWs);

      // Send message from sender to recipient
      const messagePromise = waitForMessage(recipientWs);

      senderWs.send(JSON.stringify({
        type: 'SEND',
        recipientId: recipientAuth.userId,
        ciphertext: 'Hello from sender'
      }));

      const received = await messagePromise;

      expect(received).toMatchObject({
        type: 'MESSAGE',
        sender: senderAuth.userId,
        ciphertext: 'Hello from sender'
      });

      senderWs.close();
      recipientWs.close();
    });

    it('receives ACK after sending message', async () => {
      const username = `ack_${Date.now()}`;
      const phoneNumber = `ACK User ${Date.now()}`;
      await authService.register(username, phoneNumber, 'pw');
      const auth = await authService.login(phoneNumber, 'pw');

      const ws = new WebSocket(WS_URL, {
        headers: { Cookie: auth.sessionCookie }
      });

      await waitForOpen(ws);

      const ackPromise = waitForMessage(ws);

      ws.send(JSON.stringify({
        type: 'SEND',
        recipientId: 'some-recipient-id',
        ciphertext: 'test'
      }));

      const ack = await ackPromise;

      expect(ack).toMatchObject({
        type: 'ACK',
        ok: expect.any(Boolean)
      });

      ws.close();
    });
    it('queues messages for offline users', async () => {
      const sender = `queue_sender_${Date.now()}`;
      const recipient = `queue_recipient_${Date.now()}`;
      const senderPhoneNumber = `senderphone_${Date.now()}`;
      const recipientPhoneNumber = `recipientphone_${Date.now()}`;

      await authService.register(sender, senderPhoneNumber, 'pw');
      await authService.register(recipient, recipientPhoneNumber, 'pw');

      const senderAuth = await authService.login(senderPhoneNumber, 'pw');
      const recipientAuth = await authService.login(recipientPhoneNumber, 'pw');

      // Connect sender only
      const senderWs = new WebSocket(WS_URL, {
        headers: { Cookie: senderAuth.sessionCookie }
      });
      await waitForOpen(senderWs);

      // Send message to offline recipient
      senderWs.send(JSON.stringify({
        type: 'SEND',
        recipientId: recipientAuth.userId,
        ciphertext: 'Message while offline'
      }));

      senderWs.close();

      // Now connect recipient and expect to receive the queued message
      const recipientWs = new WebSocket(WS_URL, {
        headers: { Cookie: recipientAuth.sessionCookie }
      });
      await waitForOpen(recipientWs);

      const message = await waitForMessage(recipientWs);

      expect(message).toMatchObject({
        type: 'MESSAGE',
        sender: senderAuth.userId,
        ciphertext: 'Message while offline'
      });

      recipientWs.close();
    });
  });
});