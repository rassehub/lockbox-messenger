class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers = new Map<string, (data: any) => void>();

  connect(token: string) {
    // React Native WebSocket doesn't support headers, use query param instead
    this.ws = new WebSocket(`ws://127.0.0.1:3000?token=${encodeURIComponent(token)}`);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.messageHandlers.get(data.type)?.(data);
    };
  }

  sendMessage(recipientId: string, ciphertext: string) {
    this.ws?.send(JSON.stringify({
      type: 'SEND',
      recipientId,
      ciphertext
    }));
  }

  onMessage(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }
}

export { WebSocketService };