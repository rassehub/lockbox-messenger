// fetchHttpClient.ts
import { HttpClient } from "./http"

export class FetchHttpClient implements HttpClient {
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
