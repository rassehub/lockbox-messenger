import * as Keychain from 'react-native-keychain';
import { codecs } from './codecs';
import type { SecureStorageSchema, RecordEntries } from './schema';
import {
  KeyPairType,
} from '@privacyresearch/libsignal-protocol-typescript';

const APP_NAME = 'com.lockbock';
const USERNAME = 'lockbox-item'

type Key = keyof SecureStorageSchema;

type RecordKeys = keyof RecordEntries; // 'preKeys' | 'signedPreKeys' | 'recipientIdentityKeys'

// Helper type to extract record value type for a given key
type RecordValueType<K extends RecordKeys> = 
  K extends 'preKeys' ? KeyPairType :
  K extends 'signedPreKeys' ? KeyPairType :
  K extends 'recipientIdentityKeys' ? ArrayBuffer :
  K extends 'session' ? string :
  never;

// Type guard to check if a key is a record key
function isRecordKey(key: Key): key is RecordKeys {
  return ['preKeys', 'signedPreKeys', 'recipientIdentityKeys'].includes(key as string);
}

function service(key: string) {
  return `${APP_NAME}.${key}`;
}

async function setItem<K extends Key>(
    key: K,
    value: SecureStorageSchema[K]
) {
    let encoded: string;
    
    encoded = codecs[key].encode(value);

    await Keychain.setGenericPassword(
        USERNAME,
        encoded,
        { service: service(key) }
    );
}

async function getItem<K extends Key>(
    key: K
): Promise<SecureStorageSchema[K] | undefined> {

    const item = await Keychain.getGenericPassword({
        service: service(key),
    });

    if (!item) return undefined;

    return codecs[key].decode(item.password) as SecureStorageSchema[K];
}

async function removeItem<K extends Key>(key: K) {
  await Keychain.resetGenericPassword({
    service: service(key),
  });
}

async function upsertRecordItem<K extends RecordKeys,>(
    key: K,
    id: string,
    value:  RecordValueType<K>
) {
    const current = await getItem(key);
    const record = current ?? {} as Record<string, RecordValueType<K>>;
    record[id] = value;
    await setItem(key, record as SecureStorageSchema[K]);
}

async function getRecordItem<K extends RecordKeys>(
    key: K,
    id: string
): Promise<RecordValueType<K> | undefined> {
    const record = await getItem(key) as Record<string, RecordValueType<K>> | undefined;    
    return record?.[id];
}

async function getFullRecord<K extends RecordKeys>(
    key: K
  ): Promise<Record<string, RecordValueType<K>> | undefined> {
    return await getItem(key) as Record<string, RecordValueType<K>> | undefined;
};

export async function removeRecordItem<K extends RecordKeys>(
    key: K,
    id: string
) {
    const record =
        (await getItem(key)) ??
        ({} as Record<string, RecordValueType<K>>);   
    delete record[id];
    await setItem(key, record as SecureStorageSchema[K]);
}


export const SecureStorage = {
    getItem, setItem, removeItem, upsertRecordItem, getRecordItem, getFullRecord, removeRecordItem
}