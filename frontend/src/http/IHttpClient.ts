export interface IHttpClient {
  send(request: {
    url: string
    method: string
    headers?: Record<string, string>
    body?: string
  }): Promise<Response>
}
