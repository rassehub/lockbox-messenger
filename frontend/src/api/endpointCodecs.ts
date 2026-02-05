import { arrayBufferToBase64, base64ToArrayBuffer } from "../crypto/utils/bufferEncoding";
import {
    KeyPairType,
} from '@privacyresearch/libsignal-protocol-typescript';

import type { EndpointSchema } from "./endpointConfig";
import { SignedPublicPreKeyType, PreKeyType } from "@privacyresearch/libsignal-protocol-typescript";

type KeyBundle = {
    registrationId: number;
    identityPubKey: ArrayBuffer;
    signedPreKey: SignedPublicPreKeyType
    oneTimePreKeys: PreKeyType[]
}
type PreKey = {
    keyId: number;
    publicKey: ArrayBuffer;
}


const keyBundleCodec = {
    encode: (value: { keyBundle: KeyBundle }): string =>
        JSON.stringify({
            registrationId: value.keyBundle.registrationId,
            identityPubKey: arrayBufferToBase64(value.keyBundle.identityPubKey),
            signedPreKey: {
                keyId: String(value.keyBundle.signedPreKey.keyId),
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
    encode: (req: Req) => string;
};

type DecodeOnly<Res> = {
    decode: (raw: string) => Res;
};

type EncodeDecode<Req, Res> = {
    encode: (req: Req) => string;
    decode: (raw: string) => Res;
};

export type CodecFor<K extends keyof EndpointSchema> =
    EndpointSchema[K]["request"] extends undefined
        ? EndpointSchema[K]["response"] extends undefined
            ? {} // nothing needed
            : DecodeOnly<EndpointSchema[K]["response"]>
        : EndpointSchema[K]["response"] extends undefined
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
        encode: (req: { keyBundle: KeyBundle }): string =>
            keyBundleCodec.encode(req),
    },
    rotateSignedPreKey: {
        encode: (req: { newSignedPreKey: SignedPublicPreKeyType }): string =>
            JSON.stringify({
                signedPreKey: {
                    keyId: String(req.newSignedPreKey.keyId),
                    publicKey: arrayBufferToBase64(req.newSignedPreKey.publicKey),
                    signature: arrayBufferToBase64(req.newSignedPreKey.signature),
                }
            })
    },
    addPreKeys: {
        encode: (req: { preKeys: PreKey[] }): string =>
            JSON.stringify({
                preKeys: req.preKeys.map((preKey) => ({
                    keyId: String(preKey.keyId),
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
        encode: (req: { recipientId: string }): string =>
            JSON.stringify({
                recipientId: req.recipientId
            }),
        decode: (raw: string): { keyBundle: KeyBundle } => {
            return { keyBundle: keyBundleCodec.decode(raw)}
        }
    }
}