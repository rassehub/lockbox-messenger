import { SignedPublicPreKeyType } from "@privacyresearch/libsignal-protocol-typescript";
import { KeyBundle, KeyStats, PreKeyCheckResponse, PreKeyType } from "../types";

export interface IKeyApiService {
    uploadKeyBundle(keyBundle: KeyBundle) : Promise<void>;
    fetchRecipientKeyBundle(recipientId: string) : Promise<KeyBundle>;
    rotateSignedPreKey(signedPreKey: SignedPublicPreKeyType) : Promise<void>;
    uploadPreKeys(preKeys: PreKeyType[]): Promise<void>;
    getKeyStats(): Promise<KeyStats>;
    checkPreKeys():  Promise<PreKeyCheckResponse>;
};