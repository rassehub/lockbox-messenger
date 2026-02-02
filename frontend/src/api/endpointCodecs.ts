import { arrayBufferToBase64, base64ToArrayBuffer } from "../crypto/utils/bufferEncoding";
import {
    KeyPairType,
} from '@privacyresearch/libsignal-protocol-typescript';

import type { EndpointSchema } from "./endpointConfig";
import { SignedPublicPreKeyType, PreKeyType } from "@privacyresearch/libsignal-protocol-typescript";

type KeyBundle = {
    registrationId: string;
    identityPubKey: ArrayBuffer;
    signedPreKey: SignedPublicPreKeyType
    oneTimePreKeys: PreKeyType[]
}
type PreKey = {
    keyId: string;
    publicKey: ArrayBuffer;
}


const keyBundleCodec = {
    encode: (value: { keyBundle: KeyBundle }): string =>
        JSON.stringify({
            registrationId: value.keyBundle.registrationId,
            identityPubKey: arrayBufferToBase64(value.keyBundle.identityPubKey),
            signedPreKey: {
                keyId: value.keyBundle.signedPreKey.keyId,
                publicKey: arrayBufferToBase64(value.keyBundle.signedPreKey.publicKey),
                signature: arrayBufferToBase64(value.keyBundle.signedPreKey.signature)
            },
            oneTimePreKeys: value.keyBundle.oneTimePreKeys.map((preKey) => ({
                keyId: preKey.keyId,
                publicKey: arrayBufferToBase64(preKey.publicKey),
            })),
        }),
    decode: (raw: string): KeyBundle => {
        const parsed = JSON.parse(raw);
        return {
            registrationId: parsed.registrationId,
            identityPubKey: base64ToArrayBuffer(parsed.identityPubKey),
            signedPreKey: {
                keyId: parsed.signedPreKey.keyId,
                publicKey: base64ToArrayBuffer(parsed.signedPreKey.publicKey),
                signature: base64ToArrayBuffer(parsed.signedPreKey.signature),
            },
            oneTimePreKeys: parsed.oneTimePreKeys.map((preKey: any) => ({
                keyId: preKey.keyId,
                publicKey: base64ToArrayBuffer(preKey.publicKey),
            })),
        };
    }
};


type EncodeOnly<Req> = {
    encode: (value: Req) => string;
};

type DecodeOnly<Res> = {
    decode: (raw: string) => Res;
};

type EncodeDecode<Req, Res> = {
    encode: (value: Req) => string;
    decode: (raw: string) => Res;
};

export type CodecFor<K extends keyof EndpointSchema> =
    EndpointSchema[K]["request"] extends undefined
        ? EndpointSchema[K]["response"] extends undefined | { success: boolean }
            ? {} // nothing needed
            : DecodeOnly<EndpointSchema[K]["response"]>
        : EndpointSchema[K]["response"] extends undefined | { success: boolean }
            ? EncodeOnly<EndpointSchema[K]["request"]>
            : EncodeDecode<
                EndpointSchema[K]["request"],
                EndpointSchema[K]["response"]
            >;

type EndpointCodecs = {
    [K in keyof EndpointSchema]: CodecFor<K>;
};

export const apiCodecs: EndpointCodecs = {
    login: {
        encode: (req) => 
            JSON.stringify({
                phoneNumber: req.phoneNumber,
                password: req.password,
            }),
    },
    logout: {},
    registerUser: {
        encode: (req) => 
            JSON.stringify({
                username: req.username,
                phoneNumber: req.phoneNumber,
                password: req.password,
            }),
    },
    fetchCurrentUser: {
        decode: (raw: string): { userId: string } => {
            const parsed = JSON.parse(raw)
            return { userId: parsed.userId }
        }
    },
    uploadKeyBundle: {
        encode: (value: { keyBundle: KeyBundle }): string =>
            keyBundleCodec.encode(value),
    },
    rotateSignedPreKey: {
        encode: (value: { newSignedPreKey: SignedPublicPreKeyType }): string =>
            JSON.stringify({
                signedPreKey: {
                    keyId: value.newSignedPreKey.keyId,
                    publicKey: arrayBufferToBase64(value.newSignedPreKey.publicKey),
                    signature: arrayBufferToBase64(value.newSignedPreKey.signature),
                }
            })
    },
    addPreKeys: {
        encode: (value: { preKeys: PreKey[] }): string =>
            JSON.stringify({
                preKeys: value.preKeys.map((preKey) => ({
                    keyId: preKey.keyId,
                    publicKey: arrayBufferToBase64(preKey.publicKey),
                })),
            }),
        decode: (raw: string): { availableCount: number } => {
            const parsed = JSON.parse(raw)
            return { availableCount: parsed.availableCount }
        }
    },
    checkPreKeyAvailability: {
        decode: (raw: string): { needsMorePreKeys: boolean, availableCount: number, threshold: string } => {
            const parsed = JSON.parse(raw)
            return {
                needsMorePreKeys: parsed.needsMorePreKeys,
                availableCount: parsed.availableCount,
                threshold: parsed.threshold
            }
        }
    },
    fetchMyKeyStatistics: {
        decode: (raw: string): { totalPreKeys: number, availablePreKeys: number, consumedPreKeys: number, lastUpdated: Date } => {
            const parsed = JSON.parse(raw)
            return {
                totalPreKeys: parsed.totalPreKeys,
                availablePreKeys: parsed.availablePreKeys,
                consumedPreKeys: parsed.consumedPreKeys,
                lastUpdated: parsed.lastUpdated
            }
        },
    },
    fetchRecipientKeyBundle: {
        encode: (value: { recipientId: string }): string =>
            JSON.stringify({
                recipientId: value.recipientId
            }),
        decode: (raw: string): { keyBundle: KeyBundle } => {
            return { keyBundle: keyBundleCodec.decode(raw)}
        }
    }
}