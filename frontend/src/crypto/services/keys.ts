import { ApiClient } from "src/api/apiClient";
import { createApiFacade } from "src/utils/createApiFacade";
import SignalProtocolStore from "../storage/SignalProtocolStorage";
import { generateKeyId, generateSignedPreKey, generatePreKeys, signedPreKeyToPublic, preKeyArrayToPublic} from "../utils/keys";

export const checkAndReplenishKeys = async(api: ReturnType<typeof createApiFacade>, store: SignalProtocolStore): Promise<void> => {
    const keyStats = await api.request("checkPreKeyAvailability");
    const needsMorePreKeys = keyStats.data.needsMorePreKeys;
    const availableCount = keyStats.data.availableCount;
    
    if(needsMorePreKeys) {
        console.log(`Pre-keys running low (${availableCount}). Generating more...`);
        const newPrekeys = await generatePreKeys(generateKeyId(), 100);
        
        await store.replacePreKeys(newPrekeys);
        
        const newCount  = await api.request("addPreKeys", {
            preKeys: preKeyArrayToPublic(newPrekeys)
        });
        console.log(`Pre-keys replenished. New count: ${newCount}`);
    }
}

export const rotateSignedPreKey = async(api: ReturnType<typeof createApiFacade>, store: SignalProtocolStore): Promise<void> => {
        const stats = await api.request("fetchMyKeyStatistics");
        const identityKeyPair = await store.getIdentityKeyPair();
        if (!stats.data.lastUpdated) {
          console.log('No previous key rotation found');
          return;
        }

        const daysSinceUpdate = (Date.now() - new Date(stats.data.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceUpdate > 30) {
            const keyId = generateKeyId()
            const newSignedPreKey = await generateSignedPreKey(identityKeyPair, generateKeyId());
              // Create public version of signed pre-key

            await store.storeSignedPreKey(keyId, newSignedPreKey.keyPair)
            await api.request("rotateSignedPreKey", { 
                newSignedPreKey: await signedPreKeyToPublic(keyId, newSignedPreKey) })
        }
    }

export const getUserKeysForSession  = async (recipientUserId: string, api: ReturnType<typeof createApiFacade>)  => {

        // Fetch their key bundle from server
        const serverKeyBundle = await api.request("fetchRecipientKeyBundle", {
            recipientId: recipientUserId
        });

        return serverKeyBundle
}
    