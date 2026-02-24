import * as Keychain from 'react-native-keychain';
import type { EncryptionStorageSchema, RecordEntries } from '../crypto/storage/cryptoStorageSchema';
import {
    KeyPairType,
} from '@privacyresearch/libsignal-protocol-typescript';



type Key = keyof EncryptionStorageSchema;

//type RecordKeys = keyof RecordEntries; // 'preKeys' | 'signedPreKeys' | 'recipientIdentityKeys'

// Helper type to extract record value type for a given key
/*
type RecordValueType<K extends RecordKeys> =
    K extends 'preKeys' ? KeyPairType :
    K extends 'signedPreKeys' ? KeyPairType :
    K extends 'recipientIdentityKeys' ? ArrayBuffer :
    K extends 'session' ? string :
    never;
*/

type RecordValue = Record<string, any>;

type RecordKeys<TSchema> = {
  [K in keyof TSchema]: TSchema[K] extends RecordValue ? K : never
}[keyof TSchema];

type RecordItem<
  TSchema,
  K extends RecordKeys<TSchema>
> = TSchema[K] extends Record<string, infer V> ? V : never;

export class SecureStorage<
    TSchema extends Record<string, any>,
    TCodecs extends {
        [K in keyof TSchema]: {
        encode(value: TSchema[K]): string;
        decode(value: string): TSchema[K];
        };
    }
    > {
    private APP_NAME = 'com.lockbock';
    private USERNAME = 'lockbox-item'
    private instance : string
    private codecs : TCodecs;
    constructor(instance: string, codecs: TCodecs) {
        this.instance = instance;
        this.codecs = codecs;
    }
    /*
    // Type guard to check if a key is a record key
    isRecordKey(key: Key): key is RecordKeys {
        return ['preKeys', 'signedPreKeys', 'recipientIdentityKeys'].includes(key as string);
    }
    */

  private service(key: keyof TSchema) {
    return `${this.APP_NAME}.${this.instance}.${String(key)}`;
  }

  async setItem<K extends keyof TSchema>(
    key: K,
    value: TSchema[K]
  ) {
    const encoded = this.codecs[key].encode(value);
    await Keychain.setGenericPassword(
      this.USERNAME,
      encoded,
      { service: this.service(key) }
    );
  }

  async getItem<K extends keyof TSchema>(
    key: K
  ): Promise<TSchema[K] | undefined> {
    const item = await Keychain.getGenericPassword({
      service: this.service(key),
    });

    if (!item) return undefined;
    return this.codecs[key].decode(item.password);
  }

  async removeItem<K extends keyof TSchema>(key: K) {
    await Keychain.resetGenericPassword({
      service: this.service(key),
    });
  }

  async upsertRecordItem<
    K extends RecordKeys<TSchema>
  >(
    key: K,
    id: string,
    value: RecordItem<TSchema, K>
  ) {
    const current =
      (await this.getItem(key)) ??
      ({} as TSchema[K]);

    (current as Record<string, RecordItem<TSchema, K>>)[id] = value;

    await this.setItem(key, current);
  }

  async getRecordItem<
    K extends RecordKeys<TSchema>
  >(
    key: K,
    id: string
  ): Promise<RecordItem<TSchema, K> | undefined> {
    const record = await this.getItem(key);
    return (record as Record<string, RecordItem<TSchema, K>>)?.[id];
  }

  async getFullRecord<
    K extends RecordKeys<TSchema>
  >(key: K): Promise<TSchema[K] | undefined> {
    return this.getItem(key);
  }

  async removeRecordItem<
    K extends RecordKeys<TSchema>
  >(
    key: K,
    id: string
  ) {
    const record =
      (await this.getItem(key)) ??
      ({} as TSchema[K]);

    delete (record as Record<string, any>)[id];
    await this.setItem(key, record);
  }
}
