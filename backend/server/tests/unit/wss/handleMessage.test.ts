import { sendMessage, fetchMessages } from "@/websocket/handlers/messages";

jest.mock('@/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));
jest.mock('@/db', () => ({
  getRepository: jest.fn(() => ({
    findOne: jest.fn().mockResolvedValue({ id: 'recipient-id', username: 'recipient' }),
  })),
}));
jest.mock('@/services/redis', () => ({
  addMessage: jest.fn(),
  getMessages: jest.fn().mockResolvedValue([]),
}));


describe('WebSocket Message Handlers', () => {

    const res = {
        status: jest.fn(() => res),
        send: jest.fn(),
        json: jest.fn(),
    } as any;
    it('should send a message successfully', async () => {
        const req = {
          user: { id: 'test-user-id' },
        body: {
            recipientUsername: 'recipient',
            ciphertext: 'encrypted-message',
        },
        } as any;
        await sendMessage(req, res);

        const db = require('../../../src/db');
        const redis = require('../../../src/services/redis');

        expect(db.getRepository).toHaveBeenCalled();
        expect(redis.addMessage).toHaveBeenCalledWith('recipient-id', {
            sender: 'test-user-id',
            ciphertext: 'encrypted-message',
            timestamp: expect.any(Date),
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith('Message queued');
        
    })});