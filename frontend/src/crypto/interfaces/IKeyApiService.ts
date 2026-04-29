import { SignedPublicPreKeyType } from "@privacyresearch/libsignal-protocol-typescript";
import { KeyBundle, KeyStatistics, PreKeyType } from "../types";

export interface IKeyApiService {
    uploadKeyBundle(keyBundle: KeyBundle) : Promise<void>;
    fetchRecipientKeyBundle(recipientId: string) : Promise<KeyBundle>;
    rotateSignedPreKey(signedPreKey: SignedPublicPreKeyType) : Promise<void>;
    uploadPreKeys(preKeys: PreKeyType[]): Promise<void>;
    getKeyStatistics(): Promise<KeyStatistics>;
};