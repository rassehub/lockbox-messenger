// fetchHttpClient.ts
import { IHttpClient } from "./IHttpClient"

export class HttpClient implements IHttpClient {
  constructor(private baseURL: string) {}

  async send({ url, method, headers, body }: {
    url: string
    method: string
    headers?: Record<string, string>
    body?: string
  }): Promise<Response> {
    return fetch(`${this.baseURL}${url}`, {
      method,
      headers,
      body
    })
  }
}
