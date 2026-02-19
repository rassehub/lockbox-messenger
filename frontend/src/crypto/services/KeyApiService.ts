import { ApiClient } from "../../api/apiClient";
import { IKeyApiService } from "../interfaces/IKeyApiService";
import { KeyBundle, KeyStats, PreKeyCheckResponse, PreKeyType, SignedPublicPreKeyType } from "../types";


export class KeyApiService implements IKeyApiService {
    private api: ApiClient
    constructor(api: ApiClient) {
        this.api = api;
    }

    async uploadKeyBundle(keyBundle: KeyBundle): Promise<void> {
        const response = await this.api.makeRequest("uploadKeyBundle", {keyBundle});
        if(!response.rawResponse.ok)
            throw Error (response.rawResponse.statusText);
    };

    async fetchRecipientKeyBundle(recipientId: string) : Promise<KeyBundle> {
        const keyBundle = await this.api.makeRequest("fetchRecipientKeyBundle", {recipientId});
        if(keyBundle.data.keyBundle)
            return keyBundle.data.keyBundle
        else
            throw Error (keyBundle.rawResponse.statusText)
    };

    async rotateSignedPreKey(signedPreKey: SignedPublicPreKeyType) : Promise<void> {
        const response = await this.api.makeRequest("rotateSignedPreKey", {signedPreKey});
        if(!response.rawResponse.ok)
            throw Error (response.rawResponse.statusText);
    };

    async uploadPreKeys(preKeys: PreKeyType[]) {
        const response = await this.api.makeRequest("addPreKeys", {preKeys});
        if(!response.rawResponse.ok)
            throw Error (response.rawResponse.statusText);
    };

    async getKeyStats(): Promise<KeyStats> {
        const keyStats = await this.api.makeRequest("fetchMyKeyStatistics");
        if(keyStats.data)
            return keyStats.data
        else
            throw Error (keyStats.rawResponse.statusText);
    };
    
    async checkPreKeys(): Promise<PreKeyCheckResponse> {
        const preKeyAvailability = await this.api.makeRequest("checkPreKeyAvailability");
        if(preKeyAvailability.data)
            return preKeyAvailability.data;
        else
            throw Error (preKeyAvailability.rawResponse.statusText);
    };
};