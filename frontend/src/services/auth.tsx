class AuthService {
  private sessionCookie: string | null = null;
  

  private async handleResponse(response: Response) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }
    
    return data;
  }

  private extractCookie(response: Response): string | null {
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      this.sessionCookie = setCookie.split(';')[0];
      return this.sessionCookie;
    }
    return null;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.sessionCookie) {
      headers['Cookie'] = this.sessionCookie;
    }
    return headers;
  }

  async register(username: string, phoneNumber: string, password: string) {
    const response = await fetch('http://127.0.0.1:3000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, phoneNumber, password })
    });
    
    const cookie = this.extractCookie(response);
    const data = await this.handleResponse(response);
    
    return { ...data, sessionCookie: cookie }; // Return cookie
  }

  async login( phoneNumber: string, password: string) {
    const response = await fetch('http://127.0.0.1:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, password })
    });
    
    const cookie = this.extractCookie(response);
    const data = await this.handleResponse(response);
    
    return { ...data, sessionCookie: cookie }; // Return cookie
  }

  getSessionCookie(): string | null {
    return this.sessionCookie;
  }

  async logout() {
    const response = await fetch('http://127.0.0.1:3000/logout', {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    this.sessionCookie = null; // Clear session
    return this.handleResponse(response);
  }

  async getMe() {
    const response = await fetch('http://127.0.0.1:3000/me', {
      method: 'GET',
      headers: this.getHeaders()
    });

    return this.handleResponse(response);
  }
}

export { AuthService };