import { ApiClient } from "../../api/apiClient";
import { IKeyApiService } from "../interfaces/IKeyApiService";
import { KeyBundle, KeyStatistics, PreKeyType, SignedPublicPreKeyType } from "../types";

export class KeyApiService implements IKeyApiService {
    private api: ApiClient;

    constructor(api: ApiClient) {
        this.api = api;
    }

    async uploadKeyBundle(keyBundle: KeyBundle): Promise<void> {
        const response = await this.api.makeRequest("uploadKeyBundle", { keyBundle });
        if (!response.rawResponse.ok)
            throw Error(response.rawResponse.statusText);
    }

    async fetchRecipientKeyBundle(recipientId: string): Promise<KeyBundle> {
        const res = await this.api.makeRequest("fetchRecipientKeyBundle", { recipientId });
        if (res.data?.keyBundle)
            return res.data.keyBundle;
        throw Error(res.rawResponse.statusText);
    }

    async rotateSignedPreKey(signedPreKey: SignedPublicPreKeyType): Promise<void> {
        const response = await this.api.makeRequest("rotateSignedPreKey", { signedPreKey });
        if (!response.rawResponse.ok)
            throw Error(response.rawResponse.statusText);
    }

    async uploadPreKeys(preKeys: PreKeyType[]): Promise<void> {
        const response = await this.api.makeRequest("addPreKeys", { preKeys });
        if (!response.rawResponse.ok)
            throw Error(response.rawResponse.statusText);
    }

    async getKeyStatistics(): Promise<KeyStatistics> {
        const res = await this.api.makeRequest("fetchKeyStatistics");
        if (res.data)
            return res.data;
        throw Error(res.rawResponse.statusText);
    }
}