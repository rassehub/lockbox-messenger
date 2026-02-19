import WebSocket from 'ws';
import { ISessionProvider } from "../api/ISessionProvider";


type MessageHandler = (data: any) => void;

type WebSocketEvent =
  | 'open'
  | 'message'
  | 'error'
  | 'close'
  | 'ping'
  | 'pong'
  | 'unexpected-response';


export class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers = new Map<string, MessageHandler>();

  constructor(private session: ISessionProvider) { }

  connect() {
    const cookie = this.session.getSessionToken()

    this.ws = new WebSocket('ws://127.0.0.1:3000', {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie ? cookie : "",
      },
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

    this.ws.send(
      JSON.stringify({
        type: 'SEND',
        recipientId,
        ciphertext: ciphertext
      })
    );
  }

  onMessage<T = any>(handler: (message: T) => void) {
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



      handler(message);
    });
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}
