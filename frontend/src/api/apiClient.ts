import type { EndpointSchema } from "./endpoint.config";
import { endpointConfig } from "./endpoint.config";
import { CodecFor } from "./endpoint.codecs";
import { SecureStorage } from "src/storage/secureStorage";
import { AuthService } from "src/auth/auth";

type HasEncode<T> = T extends { encode: any } ? T : never;
type HasDecode<T> = T extends { decode: any } ? T : never;

type AuthContext = {
  headers?: Record<string, string>;
  cookies?: string;
}

type ApiResponse<T> = {
  data: T;
  headers: Headers;
  rawResponse: Response;
};

export class ApiClient {

  private baseURL: string = "localhost:3000"
  private codecs = new Map<keyof EndpointSchema, any>();

  private authContext?: AuthContext;

  private setAuthContext(ctx?: AuthContext) {
    this.authContext = ctx;
  }

  _bindAuth(auth: AuthService) {
    auth._attachApi({
      setAuthContext: this.setAuthContext.bind(this),
    });
  }

  constructor() {};

  // For endpoints WITH data (request is NOT void)
  async makeRequest<T extends keyof EndpointSchema>(
    endpoint: T,
    ...[data]: EndpointSchema[T]['request'] extends undefined
      ? [] // No parameter when request is void
      : [data: EndpointSchema[T]['request']] // Required parameter when request is not void
  ): Promise<ApiResponse<EndpointSchema[T]['response']>> {
    // Implementation
    const { url, method, request } = endpointConfig[endpoint];

    const codec = this.getCodec(endpoint) as CodecFor<T>;

    let transportResponse;

    if ('encode' in (codec as object)) {
      const encoded = (codec as HasEncode<typeof codec>).encode(data);
      transportResponse = await this.sendRequest(url, method, encoded);
    } else {
      transportResponse = await this.sendRequest(url, method, "");
    }

    let decoded;

    if ('decode' in (codec as object) && transportResponse) {
      decoded = (codec as HasDecode<typeof codec>).decode(
        transportResponse.body
      );
    }

    if(transportResponse)
      return {
        data: decoded,
        headers: transportResponse.headers,
        rawResponse: transportResponse
      }
    return Promise.resolve({} as ApiResponse<EndpointSchema[T]['response']>);
}


  private getCodec<T extends keyof EndpointSchema>(endpoint: T): CodecFor<T> {
    const codec = this.codecs.get(endpoint);

    if (!codec) {
      // Return empty object for endpoints without codecs
      return {} as CodecFor<T>;
    }

    return codec as CodecFor<T>;
  }


  private async sendRequest(endpoint: string, apiMethod: string, data: string)
    : Promise<Response | undefined> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: apiMethod,
      headers:  { ...this.authContext?.headers },
      body: data,
      credentials: this.authContext?.cookies ? 'include' : 'omit',
    });
    return response;
  }

}
