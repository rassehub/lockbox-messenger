import { ISessionProvider } from "../api/ISessionProvider";

type MessageHandler = (data: any) => void;

type WebSocketEvent =
  | 'open'
  | 'message'
  | 'error'
  | 'close';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers = new Map<string, MessageHandler>();

  constructor(private session: ISessionProvider) { }

  connect() {
    const cookie = this.session.getSessionToken()

    this.ws = new WebSocket('wss://lockbox-messenger.onrender.com');
    
    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({
        type: 'AUTH',
        cookie: cookie ? cookie : ""
      }));
    };
  }

  on(event: WebSocketEvent, handler: (...args: any[]) => void) {
    if (event === 'open') this.ws!.onopen = handler as any;
    if (event === 'message') this.ws!.onmessage = handler as any;
    if (event === 'error') this.ws!.onerror = handler as any;
    if (event === 'close') this.ws!.onclose = handler as any;
  }

  once(event: WebSocketEvent, handler: (...args: any[]) => void) {
    const wrappedHandler = (...args: any[]) => {
      handler(...args);
      this.on(event, () => {}); 
    };
    this.on(event, wrappedHandler);
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
    this.ws!.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handler(message);
    };
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}