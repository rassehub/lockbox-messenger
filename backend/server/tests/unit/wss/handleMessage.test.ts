// Mock logger first
jest.mock('@/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

// Mock db - export getRepository function that your handler uses
jest.mock('@/db', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({
      findOne: jest.fn().mockResolvedValue({ id: 'recipient-id', username: 'recipient' }),
    })),
    isInitialized: true,
  },
  getRepository: jest.fn(() => ({
    findOne: jest.fn().mockResolvedValue({ id: 'recipient-id', username: 'recipient' }),
  })),
  initDb: jest.fn(),
  closeDb: jest.fn(),
}));

// Mock redis/cache
jest.mock('@/services/redis', () => ({
  addMessage: jest.fn(),
  getMessages: jest.fn().mockResolvedValue([]),
  initCache: jest.fn(),
  closeCache: jest.fn(),
}));

// Import AFTER mocks
import { sendMessage, fetchMessages } from '@/websocket/handlers/messages';
import { getRepository } from '@/db';
import { addMessage, getMessages } from '@/services/redis';

describe('WebSocket Message Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      const req = {
        user: { id: 'test-user-id' },
        body: {
          recipientUsername: 'recipient',
          ciphertext: 'encrypted-message',
        },
      } as any;

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      } as any;

      await sendMessage(req, res);

      expect(getRepository).toHaveBeenCalled();
      expect(addMessage).toHaveBeenCalledWith('recipient-id', {
        sender: 'test-user-id',
        ciphertext: 'encrypted-message',
        timestamp: expect.any(Date),
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('Message queued');
    });

    it('should handle recipient not found', async () => {
      // Override the mock for this test
      (getRepository as jest.Mock).mockReturnValueOnce({
        findOne: jest.fn().mockResolvedValue(null),
      });

      const req = {
        user: { id: 'test-user-id' },
        body: {
          recipientUsername: 'nonexistent',
          ciphertext: 'encrypted-message',
        },
      } as any;

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      } as any;

      await sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('User not found');
    });

    it('should handle unauthorized user', async () => {
      const req = {
        user: undefined, // No user in request
        body: {
          recipientUsername: 'recipient',
          ciphertext: 'encrypted-message',
        },
      } as any;

      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      } as any;

      await sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith('Unauthorized: user not found in request');
    });
  });

  describe('fetchMessages', () => {
    it('should fetch messages successfully', async () => {
      const mockMessages = [
        { sender: 'sender-1', ciphertext: 'msg1', timestamp: new Date() },
        { sender: 'sender-2', ciphertext: 'msg2', timestamp: new Date() },
      ];

      (getMessages as jest.Mock).mockResolvedValueOnce(mockMessages);

      const req = {
        user: { id: 'test-user-id' },
      } as any;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
      } as any;

      await fetchMessages(req, res);

      expect(getMessages).toHaveBeenCalledWith('test-user-id');
      // Note: fetchMessages doesn't call res.status(), just res.json()
      expect(res.json).toHaveBeenCalledWith(mockMessages);
    });

    it('should handle empty messages', async () => {
      (getMessages as jest.Mock).mockResolvedValueOnce([]);

      const req = {
        user: { id: 'test-user-id' },
      } as any;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
      } as any;

      await fetchMessages(req, res);

      expect(getMessages).toHaveBeenCalledWith('test-user-id');
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle unauthorized user', async () => {
      const req = {
        user: undefined, // No user in request
      } as any;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
      } as any;

      await fetchMessages(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith('Unauthorized: user not found in request');
    });
  });
});