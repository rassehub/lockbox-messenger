// __tests__/services/websocket.test.ts
import { WebSocketService } from '../../services/websocket';

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
})) as any;

describe('WebSocketService', () => {
  it('connects and sends messages', () => {
    const ws = new WebSocketService();
    ws.connect('test-token');
    ws.sendMessage('user123', 'hello');
    
    expect(WebSocket).toHaveBeenCalledWith(
      'ws://127.0.0.1:3000',
      [],
      { headers: { Cookie: 'sessionToken=test-token' } }
    );
  });
});