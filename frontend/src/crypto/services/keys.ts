import { ApiClient } from "src/api/apiClient";
import SignalProtocolStore from "../storage/SignalProtocolStorage";
import { generateKeyId, generateSignedPreKey, generatePreKeys, signedPreKeyToPublic, preKeyArrayToPublic} from "../utils/keys";

export const checkAndReplenishKeys = async(api: ApiClient, store: SignalProtocolStore): Promise<void> => {
    const { needsMorePreKeys, availableCount } = await api.makeRequest("checkPreKeyAvailability");
    if(needsMorePreKeys) {
        console.log(`Pre-keys running low (${availableCount}). Generating more...`);
        const newPrekeys = await generatePreKeys(generateKeyId(), 100);
        
        await store.replacePreKeys(newPrekeys);
        
        const newCount  = await api.makeRequest("addPreKeys", {
            preKeys: preKeyArrayToPublic(newPrekeys)
        });
        console.log(`Pre-keys replenished. New count: ${newCount}`);
    }
}

export const rotateSignedPreKey = async(api: ApiClient, store: SignalProtocolStore): Promise<void> => {
        const stats = await api.makeRequest("fetchMyKeyStatistics");
        const identityKeyPair = await store.getIdentityKeyPair();
        if (!stats.lastUpdated) {
          console.log('No previous key rotation found');
          return;
        }

        const daysSinceUpdate = (Date.now() - new Date(stats.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceUpdate > 30) {
            const keyId = generateKeyId()
            const newSignedPreKey = await generateSignedPreKey(identityKeyPair, generateKeyId());
              // Create public version of signed pre-key

            await store.storeSignedPreKey(keyId, newSignedPreKey.keyPair)
            await api.makeRequest("rotateSignedPreKey", { 
                newSignedPreKey: await signedPreKeyToPublic(keyId, newSignedPreKey) })
        }
    }

export const getUserKeysForSession  = async (recipientUserId: string, api: ApiClient)  => {

        // Fetch their key bundle from server
        const serverKeyBundle = await api.makeRequest("fetchRecipientKeyBundle", {
            recipientId: recipientUserId
        });

        return serverKeyBundle
}
    