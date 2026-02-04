import * as Keychain from 'react-native-keychain';
import { codecs } from './codecs';
import type { SecureStorageSchema, RecordEntries } from './schema';
import {
    KeyPairType,
} from '@privacyresearch/libsignal-protocol-typescript';



type Key = keyof SecureStorageSchema;

type RecordKeys = keyof RecordEntries; // 'preKeys' | 'signedPreKeys' | 'recipientIdentityKeys'

// Helper type to extract record value type for a given key
type RecordValueType<K extends RecordKeys> =
    K extends 'preKeys' ? KeyPairType :
    K extends 'signedPreKeys' ? KeyPairType :
    K extends 'recipientIdentityKeys' ? ArrayBuffer :
    K extends 'session' ? string :
    never;

export class SecureStorage {
    private APP_NAME = 'com.lockbock';
    private USERNAME = 'lockbox-item'
    private instance : string
    constructor(instance: string) {
        this.instance = instance  
    }
    // Type guard to check if a key is a record key
    isRecordKey(key: Key): key is RecordKeys {
        return ['preKeys', 'signedPreKeys', 'recipientIdentityKeys'].includes(key as string);
    }

    service(key: string) {
        return `${this.APP_NAME}.${this.instance}.${key}`;
    }

    async setItem<K extends Key>(
        key: K,
        value: SecureStorageSchema[K]
    ) {
        let encoded: string;

        encoded = codecs[key].encode(value);
        //if(key !== "preKeys")
        //    console.log(`saving: ${this.APP_NAME}.${this.instance}.${key}`)
        await Keychain.setGenericPassword(
            this.USERNAME,
            encoded,
            { service: this.service(key) }
        );
    }

    async getItem<K extends Key>(
        key: K
    ): Promise<SecureStorageSchema[K] | undefined> {
        //if(key !== "preKeys")
        //    console.log(`loading: ${this.APP_NAME}.${this.instance}.${key}`)
        const item = await Keychain.getGenericPassword({
            service: this.service(key),
        });

        if (!item) return undefined;

        return codecs[key].decode(item.password) as SecureStorageSchema[K];
    }

    async removeItem<K extends Key>(key: K) {
        await Keychain.resetGenericPassword({
            service: this.service(key),
        });
    }

    async upsertRecordItem<K extends RecordKeys,>(
        key: K,
        id: string,
        value: RecordValueType<K>
    ) {
        const current = await this.getItem(key);
        const record = current ?? {} as Record<string, RecordValueType<K>>;
        record[id] = value;
        await this.setItem(key, record as SecureStorageSchema[K]);
    }

    async getRecordItem<K extends RecordKeys>(
        key: K,
        id: string
    ): Promise<RecordValueType<K> | undefined> {
        const record = await this.getItem(key) as Record<string, RecordValueType<K>> | undefined;
        return record?.[id];
    }

    async getFullRecord<K extends RecordKeys>(
        key: K
    ): Promise<Record<string, RecordValueType<K>> | undefined> {
        return await this.getItem(key) as Record<string, RecordValueType<K>> | undefined;
    };

    async removeRecordItem<K extends RecordKeys>(
        key: K,
        id: string
    ) {
        const record =
            (await this.getItem(key)) ??
            ({} as Record<string, RecordValueType<K>>);
        delete record[id];
        await this.setItem(key, record as SecureStorageSchema[K]);
    }

}