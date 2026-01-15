import {
    KeyHelper,
    SignedPublicPreKeyType,
    SignalProtocolAddress,
    SessionBuilder,
    PreKeyType,
    SessionCipher,
    MessageType }
from '@privacyresearch/libsignal-protocol-typescript'

const safeStore: Record<string, any> = {};

function storeSomewhereSafe(key: string, value: any) {
    safeStore[key] = value;
}

let keyIdCounter = 1;
function makeKeyId() {
    return keyIdCounter++;
}

const directory = {
    keyBundles: {} as Record<string, any>,
    storeKeyBundle(name: string, bundle: any) {
        this.keyBundles[name] = bundle;
        console.log(`Stored key bundle for ${name}: `, bundle);
    }
};

class InMemorySignalProtocolStore {
    private store: Record<string, any> = {};

    get(key: string) {
        return this.store[key];
    }
    put(key: string, value: any) {
        this.store[key] = value;
    }
    storePreKey(keyId: string, keyPair: any) {
        this.put(`preKey${keyId}`, keyPair);
    }
    storeSignedPreKey(keyId: string, keyPair: any) {
        this.put(`signedPreKey${keyId}`, keyPair);
    }
}

const store = new InMemorySignalProtocolStore();

const createID = async (name: string, store: InMemorySignalProtocolStore) => {
  const registrationId = KeyHelper.generateRegistrationId()
  storeSomewhereSafe(`registrationID`, registrationId)

  const identityKeyPair = await KeyHelper.generateIdentityKeyPair()
  storeSomewhereSafe('identityKey', identityKeyPair)

  const baseKeyId = makeKeyId()
  const preKey = await KeyHelper.generatePreKey(baseKeyId)
  store.storePreKey(`${baseKeyId}`, preKey.keyPair)

  const signedPreKeyId = makeKeyId()
  const signedPreKey = await KeyHelper.generateSignedPreKey(identityKeyPair, signedPreKeyId)
  store.storeSignedPreKey(`${signedPreKeyId}`, signedPreKey.keyPair)

  // Now we register this with the server or other directory so all users can see them.
  // You might implement your directory differently, this is not part of the SDK.

  const publicSignedPreKey: SignedPublicPreKeyType = {
    keyId: signedPreKeyId,
    publicKey: signedPreKey.keyPair.pubKey,
    signature: signedPreKey.signature,
  }

  const publicPreKey: PreKeyType = {
    keyId: preKey.keyId,
    publicKey: preKey.keyPair.pubKey,
  }

  directory.storeKeyBundle(name, {
    registrationId,
    identityPubKey: identityKeyPair.pubKey,
    signedPreKey: publicSignedPreKey,
    oneTimePreKeys: [publicPreKey],
  })
};

(async () => {
    await createID('alice', store)
})();
