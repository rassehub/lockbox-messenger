import { arrayBufferToBase64, base64ToArrayBuffer } from "../utils/bufferEncoding";
import type { EncryptionStorageSchema } from "./cryptoStorageSchema";
import {
  KeyPairType,
} from '@privacyresearch/libsignal-protocol-typescript';


const numberCodec = {
    encode: (value: number): string =>
        String(value),
    decode:  (raw: string) : number =>
        parseInt(raw, 10),
};

const stringCodec = {
    encode: (value: string): string => value,
    decode: (raw: string): string => raw
};

const stringMapCodec = {
    encode: (value: Record<string, string> ): string =>
        JSON.stringify(
            Object.fromEntries(
                Object.entries(value).map(([id, kp]) => [
                    id,
                    kp,
                ])
            )
        ),
    decode:  (raw: string): Record<string, string> => {
        const parsed = JSON.parse(raw)
        return Object.fromEntries(
            Object.entries(parsed).map(([id, kp]: any) => [
                id,
                kp,
            ])
        );
    },
};

const identityKeyMapCodec = {
    encode: (value: Record<string, ArrayBuffer> ): string =>
        JSON.stringify(
            Object.fromEntries(
                Object.entries(value).map(([id, kp]) => [
                    id,
                    arrayBufferToBase64(kp),
                ])
            )
        ),
    decode:  (raw: string): Record<string, ArrayBuffer> => {
        const parsed = JSON.parse(raw)
        return Object.fromEntries(
            Object.entries(parsed).map(([id, kp]: any) => [
                id,
                base64ToArrayBuffer(kp),
            ])
        );
    },
};

const keyPairCodec = {
  encode: (value: KeyPairType) : string =>
    JSON.stringify({
      pubKey: arrayBufferToBase64(value.pubKey),
      privKey: arrayBufferToBase64(value.privKey),
    }),

  decode: (raw: string) : KeyPairType => {
    const parsed = JSON.parse(raw);
    return {
      pubKey: base64ToArrayBuffer(parsed.pubKey),
      privKey: base64ToArrayBuffer(parsed.privKey),
    };
  },
};

const keyPairMapCodec = {
  encode: (value: Record<string, KeyPairType>): string =>
    JSON.stringify(
      Object.fromEntries(
        Object.entries(value).map(([id, kp]) => [
          id,
          {
            pubKey: arrayBufferToBase64(kp.pubKey),
            privKey: arrayBufferToBase64(kp.privKey),
          },
        ])
      )
    ),

  decode: (raw: string): Record<string, KeyPairType> => {
    const parsed = JSON.parse(raw);
    return Object.fromEntries(
      Object.entries(parsed).map(([id, kp]: any) => [
        id,
        {
          pubKey: base64ToArrayBuffer(kp.pubKey),
          privKey: base64ToArrayBuffer(kp.privKey),
        },
      ])
    );
  },
};

export const encryptionCodecs: {
    [K in keyof EncryptionStorageSchema]: {
        encode: (value: EncryptionStorageSchema[K]) => string;
        decode: (raw: string) => EncryptionStorageSchema[K];
    };
} = {
    identityKey: keyPairCodec,

    recipientIdentityKeys: identityKeyMapCodec,

    preKeys: keyPairMapCodec,
    signedPreKeys: keyPairMapCodec,
    signedPreKeyId: numberCodec,

    session: stringMapCodec,
    registrationId: numberCodec,
};