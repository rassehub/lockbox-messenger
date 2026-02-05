import { EndpointSchema } from "src/api/endpoint.config";
import { ApiClient } from "src/api/apiClient";

type ApiResponse<T> = {
  data: T;
  headers: Headers;
  rawResponse: Response;
};

type ApiFacade<K extends readonly (keyof EndpointSchema)[]> = {
  request<T extends K[number]>(
    endpoint: T,
    ...args: EndpointSchema[T]["request"] extends undefined
      ? []
      : [EndpointSchema[T]["request"]]
  ): Promise<ApiResponse<EndpointSchema[T]["response"]>>;
};

export function createApiFacade<
  K extends readonly (keyof EndpointSchema)[]
>(
  keys: K,
  api: ApiClient
): ApiFacade<K> {
  return {
    request(endpoint, ...args) {
      // runtime safety (optional but nice)
      if (!keys.includes(endpoint)) {
        throw new Error(`Endpoint ${String(endpoint)} not allowed`);
      }
      return api.makeRequest(endpoint as any, ...(args as any));
    },
  };
}