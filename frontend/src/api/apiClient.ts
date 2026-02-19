import type { EndpointSchema } from "./apiEndpointConfig";
import { endpointConfig } from "./apiEndpointConfig";
import { CodecFor, apiCodecs } from "./apiEndpointCodecs";
import { ISessionProvider } from "./ISessionProvider";
import { IHttpClient } from "../http/IHttpClient";

type HasEncode<T> = T extends { encode: any } ? T : never;
type HasDecode<T> = T extends { decode: any } ? T : never;


type ApiResponse<T> = {
  data: T;
  headers: Headers;
  rawResponse: Response;
};

export class ApiClient {
  private codecs = new Map<keyof EndpointSchema, any>();

  constructor(private session: ISessionProvider, private http: IHttpClient,) {
    this.codecs = new Map(
      Object.entries(apiCodecs) as [keyof EndpointSchema, any][]
    );
  };

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
      transportResponse = await this.request(url, method, encoded);
    } else {
      transportResponse = await this.request(url, method, "");
    }
    if (!transportResponse.ok)
      throw Error(`Error: api-request failed: ${transportResponse.statusText}`)
    let decoded;
    if ('decode' in (codec as object) && transportResponse) {
      decoded = (codec as HasDecode<typeof codec>).decode(await transportResponse.json());
    }

    if (transportResponse)
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

  private async request(endpoint: string, method: string, data: string): Promise<Response> {
    const cookie = this.session.getSessionToken()
    const init: RequestInit = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie ? cookie : "",
      },
    };

    if (method !== "GET" && method !== "HEAD" && data) {
      init.body = data;
    }
    return this.http.send({
      url: endpoint,
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {})
      },
      body:
        method !== "GET" && method !== "HEAD" && data
          ? data
          : undefined
    })
  }
}
