import type { EndpointSchema } from "./endpointConfig";
import { endpointConfig } from "./endpointConfig";
import { CodecFor } from "./endpointCodecs";

type HasEncode<T> = T extends { encode: any } ? T : never;
type HasDecode<T> = T extends { decode: any } ? T : never;

class ApiClient {

  private sessionCookie: string;
  private baseURL: string = "localhost:3000"
  private codecs = new Map<keyof EndpointSchema, any>();

  constructor() {
    this.sessionCookie = "e"
  };

  // For endpoints WITH data (request is NOT void)
  makeRequest<T extends keyof EndpointSchema>(
    endpoint: T,
    ...[data]: EndpointSchema[T]['request'] extends undefined
      ? [] // No parameter when request is void
      : [data: EndpointSchema[T]['request']] // Required parameter when request is not void
  ): Promise<EndpointSchema[T]['response']> {
    // Implementation
    const { url, method, request } = endpointConfig[endpoint];

    let encoded: string

    const codec = this.getCodec(endpoint) as CodecFor<T>;

    if ('encode' in (codec as object)) {
      encoded = (codec as HasEncode<typeof codec>).encode(data);
      const response = this.sendRequest(url, method, encoded);
      if ('decode' in (codec as object)) {
        const decoded = (codec as HasDecode<typeof codec>).decode(response)
        return decoded
      }
    }
    else {
      const response = this.sendRequest(url, method, "");
      if ('decode' in (codec as object)) {
        const decoded = (codec as HasDecode<typeof codec>).decode(response)
        return decoded
      }
    }

    return Promise.resolve({} as EndpointSchema[T]['response']);
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.sessionCookie) {
      headers['Cookie'] = `${this.sessionCookie}`;
    }
    return headers;
  }

  private getCodec<T extends keyof EndpointSchema>(endpoint: T): CodecFor<T> {
    const codec = this.codecs.get(endpoint);

    if (!codec) {
      // Return empty object for endpoints without codecs
      return {} as CodecFor<T>;
    }

    return codec as CodecFor<T>;
  }

  setSessionCookie(cookie: string) {
    this.sessionCookie = cookie
  }

  private async sendRequest(endpoint: string, apiMethod: string, data: string)
    : Promise<Response | undefined> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: apiMethod,
      headers: this.getHeaders(),
      body: data,
      credentials: "include"
    });
    return response;
  }

}
