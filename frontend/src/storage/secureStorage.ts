import AsyncStorage from '@react-native-async-storage/async-storage';
import { MasterKeyStore } from './masterKeyStore';

type RecordValue = Record<string, any>;

type RecordKeys<TSchema> = {
  [K in keyof TSchema]: TSchema[K] extends RecordValue ? K : never;
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
  private instance: string;
  private codecs: TCodecs;
  private keyStore: MasterKeyStore;

  constructor(instance: string, codecs: TCodecs) {
    this.instance = instance;
    this.codecs = codecs;
    this.keyStore = MasterKeyStore.getInstance();
  }

  private storageKey(key: keyof TSchema): string {
    return `${this.APP_NAME}.${this.instance}.${String(key)}`;
  }

  async setItem<K extends keyof TSchema>(key: K, value: TSchema[K]): Promise<void> {
    const encoded = this.codecs[key].encode(value);
    const encrypted = await this.keyStore.encrypt(encoded);
    await AsyncStorage.setItem(this.storageKey(key), encrypted);
  }

  async getItem<K extends keyof TSchema>(key: K): Promise<TSchema[K] | undefined> {
    const encrypted = await AsyncStorage.getItem(this.storageKey(key));
    if (!encrypted) return undefined;
    const decrypted = await this.keyStore.decrypt(encrypted);
    return this.codecs[key].decode(decrypted);
  }

  async removeItem<K extends keyof TSchema>(key: K): Promise<void> {
    await AsyncStorage.removeItem(this.storageKey(key));
  }

  async upsertRecordItem<K extends RecordKeys<TSchema>>(
    key: K,
    id: string,
    value: RecordItem<TSchema, K>
  ): Promise<void> {
    const current = (await this.getItem(key)) ?? ({} as TSchema[K]);
    (current as Record<string, RecordItem<TSchema, K>>)[id] = value;
    await this.setItem(key, current);
  }

  async getRecordItem<K extends RecordKeys<TSchema>>(
    key: K,
    id: string
  ): Promise<RecordItem<TSchema, K> | undefined> {
    const record = await this.getItem(key);
    return (record as Record<string, RecordItem<TSchema, K>>)?.[id];
  }

  async getFullRecord<K extends RecordKeys<TSchema>>(
    key: K
  ): Promise<TSchema[K] | undefined> {
    return this.getItem(key);
  }

  async removeRecordItem<K extends RecordKeys<TSchema>>(
    key: K,
    id: string
  ): Promise<void> {
    const record = (await this.getItem(key)) ?? ({} as TSchema[K]);
    delete (record as Record<string, any>)[id];
    await this.setItem(key, record);
  }
}