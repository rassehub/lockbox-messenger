/**
 * Signal Protocol Key Service - Client Side
 * Handles communication with the server for key management operations
 * Works in conjunction with SignalProtocolManager for local key generation
 */

import { SignalKeyBundle } from './types';

export interface KeyStatistics {
  totalPreKeys: number;
  availablePreKeys: number;
  consumedPreKeys: number;
  lastUpdated: Date | null;
}

export interface PreKeyCheckResponse {
  success: boolean;
  needsMorePreKeys: boolean;
  availableCount: number;
  threshold: number;
}

class KeyService {
  private baseUrl: string;
  private sessionCookie: string | null = null;

  constructor(baseUrl: string = 'http://127.0.0.1:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Set the session cookie for authenticated requests
   */
  setSessionCookie(cookie: string | null) {
    this.sessionCookie = cookie;
  }

  /**
   * Get headers for authenticated requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.sessionCookie) {
      headers['Cookie'] = `${this.sessionCookie}`;
    }
    console.log(`keksi ${this.sessionCookie}`)
    console.log(`headers: ${JSON.stringify(headers)}`);
    return headers;
  }

  /**
   * Handle API responses
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
    }
    
    return data;
  }

  /**
   * Upload user's key bundle to the server
   * Call this after registration or during key rotation
   * 
   * @param keyBundle - The complete Signal key bundle
   */
  async uploadKeyBundle(keyBundle: SignalKeyBundle): Promise<void> {
    const response = await fetch(`${this.baseUrl}/keys/upload`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ keyBundle }),
      credentials: "include"
    });

    await this.handleResponse<{ success: boolean; message: string }>(response);
  }

  /**
   * Get another user's key bundle to establish a session
   * This consumes one of their pre-keys
   * 
   * @param userId - The ID of the user whose keys you want to fetch
   */
  async getKeyBundle(userId: string): Promise<SignalKeyBundle> {
    const response = await fetch(`${this.baseUrl}/keys/${userId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    const data = await this.handleResponse<{ success: boolean; keyBundle: SignalKeyBundle }>(response);
    return data.keyBundle;
  }

  /**
   * Get statistics about current user's keys
   */
  async getKeyStatistics(): Promise<KeyStatistics> {
    const response = await fetch(`${this.baseUrl}/keys/stats/me`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    const data = await this.handleResponse<{ success: boolean; stats: KeyStatistics }>(response);
    return data.stats;
  }

  /**
   * Check if current user needs to upload more pre-keys
   */
  async checkPreKeys(): Promise<PreKeyCheckResponse> {
    console.log('hello from checkprekeys')
    const response = await fetch(`${this.baseUrl}/keys/check-prekeys`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    return this.handleResponse<PreKeyCheckResponse>(response);
  }

  /**
   * Add more one-time pre-keys when running low
   * 
   * @param preKeys - Array of pre-keys to upload
   */
  async addPreKeys(preKeys: Array<{ keyId: number; publicKey: string }>): Promise<number> {
    const response = await fetch(`${this.baseUrl}/keys/add-prekeys`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ preKeys })
    });

    const data = await this.handleResponse<{ 
      success: boolean; 
      message: string; 
      availableCount: number 
    }>(response);
    
    return data.availableCount;
  }

  /**
   * Rotate the signed pre-key (should be done periodically)
   * 
   * @param signedPreKey - New signed pre-key
   */
  async rotateSignedPreKey(signedPreKey: {
    keyId: number;
    publicKey: string;
    signature: string;
  }): Promise<void> {
    const response = await fetch(`${this.baseUrl}/keys/rotate-signed-prekey`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ signedPreKey })
    });

    await this.handleResponse<{ success: boolean; message: string }>(response);
  }
}

// Export a singleton instance
export const keyService = new KeyService();
export default KeyService;
