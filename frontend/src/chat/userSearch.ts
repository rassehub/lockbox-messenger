import { ApiClient } from "../api/apiClient";

export class userSearch {
    private api: ApiClient;

    constructor(api: ApiClient) {
        this.api = api;
    }

    async searchUsers(userQuery: string): Promise<string[]> {
        const response = await this.api.makeRequest("searchUsers", { userQuery });
        if (!response.rawResponse.ok)
            throw Error(response.rawResponse.statusText);
        return response.data.usernames
    }

    async getUserId(username: string): Promise<string> {
        const response = await this.api.makeRequest("getUserId", { username });
        if (!response.rawResponse.ok)
            throw Error(response.rawResponse.statusText);
        return response.data.userId
    }
}