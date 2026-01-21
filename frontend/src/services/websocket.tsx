import WebSocket from 'ws';

type MessageHandler = (data: any) => void;

type WebSocketEvent =
  | 'open'
  | 'message'
  | 'error'
  | 'close'
  | 'ping'
  | 'pong'
  | 'unexpected-response';

class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers = new Map<string, MessageHandler>();

  connect(token: string) {
    this.ws = new WebSocket('ws://127.0.0.1:3000', {
      headers: { Cookie: token },
    });
  }

  on(event: WebSocketEvent, handler: (...args: any[]) => void) {
    this.ws?.on(event, handler);
  }

  once(event: WebSocketEvent, handler: (...args: any[]) => void) {
    this.ws?.once(event, handler);
  }

  sendMessage(recipientId: string, ciphertext: { type: number; body: string }) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }

  const encodedMessage = {
    type: ciphertext.type,
    body: Buffer.from(ciphertext.body).toString('base64'),
  };

    this.ws.send(
      JSON.stringify({
        type: 'SEND',
        recipientId,
        ciphertext: encodedMessage,
      })
    );
  }

  onMessage<T = any > (handler: (message: T) => void) {
    this.ws?.on('message', (raw) => {
      const text =
        typeof raw === 'string'
          ? raw
          : Buffer.isBuffer(raw)
          ? raw.toString('utf8')
          : Array.isArray(raw)
          ? Buffer.concat(raw).toString('utf8')
          : Buffer.from(raw).toString('utf8');
      
      const message = JSON.parse(text);
      message.ciphertext.body = Buffer.from(message.ciphertext.body, 'base64');
      message.ciphertext.body = message.ciphertext.body.toString();

      handler(message);
    });
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export default WebSocketService;