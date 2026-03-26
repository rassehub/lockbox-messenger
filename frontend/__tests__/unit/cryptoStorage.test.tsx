// tests/unit/crypto/cryptoStorage.test.ts
import { CryptoStorage } from '../../src/crypto/storage/CryptoStorage';
import { SecureStorage } from '../../src/storage/secureStorage';

jest.mock('../../src/storage/secureStorage');
jest.mock('../../src/crypto/storage/cryptoStorageCodecs', () => ({ encryptionCodecs: {} }));

const MockedSecureStorage = SecureStorage as jest.MockedClass<typeof SecureStorage>;

describe('CryptoStorage', () => {
    let cryptoStorage: CryptoStorage;
    let store: jest.Mocked<InstanceType<typeof SecureStorage>>;
    const mockKeyPair = { pubKey: new ArrayBuffer(32), privKey: new ArrayBuffer(32) };

    beforeEach(() => {
        jest.clearAllMocks();
        (CryptoStorage as any).instance = undefined;
        cryptoStorage = new CryptoStorage('user123');
        store = MockedSecureStorage.mock.instances[0] as any;
    });

    describe('identity key', () => {
        it('returns key pair when found', async () => {
            store.getItem.mockResolvedValue(mockKeyPair);
            expect(await cryptoStorage.getIdentityKeyPair()).toEqual(mockKeyPair);
        });

        it('returns undefined when not found', async () => {
            store.getItem.mockResolvedValue(null);
            expect(await cryptoStorage.getIdentityKeyPair()).toBeUndefined();
        });

        it('stores identity key pair', async () => {
            await cryptoStorage.storeIdentityKeyPair(mockKeyPair);
            expect(store.setItem).toHaveBeenCalledWith('identityKey', mockKeyPair);
        });
    });

    describe('registration ID', () => {
        it('returns registration ID when found', async () => {
            store.getItem.mockResolvedValue(12345);
            expect(await cryptoStorage.getLocalRegistrationId()).toBe(12345);
        });

        it('returns undefined when not found', async () => {
            store.getItem.mockResolvedValue(null);
            expect(await cryptoStorage.getLocalRegistrationId()).toBeUndefined();
        });

        it('stores registration ID', async () => {
            await cryptoStorage.storeLocalRegistrationId(12345);
            expect(store.setItem).toHaveBeenCalledWith('registrationId', 12345);
        });
    });

    describe('isTrustedIdentity', () => {
        it('always returns true', async () => {
            expect(await cryptoStorage.isTrustedIdentity('user1', new ArrayBuffer(32), 1)).toBe(true);
        });
    });

    describe('saveIdentity', () => {
        it('returns true when no prior key exists', async () => {
            store.getRecordItem.mockResolvedValue(null);
            expect(await cryptoStorage.saveIdentity('user1', new ArrayBuffer(32))).toBe(true);
        });

        it('returns false when stored key is identical', async () => {
            const key = new ArrayBuffer(4);
            new Uint8Array(key).set([1, 2, 3, 4]);
            const sameKey = new ArrayBuffer(4);
            new Uint8Array(sameKey).set([1, 2, 3, 4]);
            store.getRecordItem.mockResolvedValue(key);
            expect(await cryptoStorage.saveIdentity('user1', sameKey)).toBe(false);
        });

        it('returns true when stored key differs', async () => {
            const oldKey = new ArrayBuffer(4);
            new Uint8Array(oldKey).set([1, 2, 3, 4]);
            const newKey = new ArrayBuffer(4);
            new Uint8Array(newKey).set([5, 6, 7, 8]);
            store.getRecordItem.mockResolvedValue(oldKey);
            expect(await cryptoStorage.saveIdentity('user1', newKey)).toBe(true);
        });
    });

    describe('prekey management', () => {
        it('loads prekey by ID coerced to string', async () => {
            store.getRecordItem.mockResolvedValue(mockKeyPair);
            await cryptoStorage.loadPreKey(1);
            expect(store.getRecordItem).toHaveBeenCalledWith('preKeys', '1');
        });

        it('returns undefined when prekey not found', async () => {
            store.getRecordItem.mockResolvedValue(null);
            expect(await cryptoStorage.loadPreKey(99)).toBeUndefined();
        });

        it('loads all prekeys and maps string IDs to numbers', async () => {
            store.getFullRecord.mockResolvedValue({ '1': mockKeyPair, '2': mockKeyPair });

            const result = await cryptoStorage.loadAllPreKeys();

            expect(result).toEqual([
                { keyId: 1, keyPair: mockKeyPair },
                { keyId: 2, keyPair: mockKeyPair },
            ]);
        });

        it('returns undefined when prekey record is empty', async () => {
            store.getFullRecord.mockResolvedValue(null);
            expect(await cryptoStorage.loadAllPreKeys()).toBeUndefined();
        });

        it('merges new prekeys into existing record', async () => {
            store.getFullRecord.mockResolvedValue({ '1': mockKeyPair });
            await cryptoStorage.storePreKeys([{ keyId: 2, keyPair: mockKeyPair }]);
            expect(store.setItem).toHaveBeenCalledWith('preKeys', { '1': mockKeyPair, '2': mockKeyPair });
        });

        it('replaces all prekeys with new set', async () => {
            await cryptoStorage.replacePreKeys([{ keyId: 1, keyPair: mockKeyPair }]);
            expect(store.setItem).toHaveBeenCalledWith('preKeys', { '1': mockKeyPair });
        });

        it('removes prekey by ID', async () => {
            await cryptoStorage.removePreKey(1);
            expect(store.removeRecordItem).toHaveBeenCalledWith('preKeys', '1');
        });
    });

    describe('signed prekey management', () => {
        it('loads signed prekey by ID', async () => {
            store.getRecordItem.mockResolvedValue(mockKeyPair);
            await cryptoStorage.loadSignedPreKey(1);
            expect(store.getRecordItem).toHaveBeenCalledWith('signedPreKeys', '1');
        });

        it('loads all signed prekeys and maps string IDs to numbers', async () => {
            store.getFullRecord.mockResolvedValue({ '9': mockKeyPair, '10': mockKeyPair });

            const result = await cryptoStorage.loadAllSignedPreKeys();

            expect(result).toEqual([
                { keyId: 9, keyPair: mockKeyPair },
                { keyId: 10, keyPair: mockKeyPair },
            ]);
        });

        it('returns undefined when no signed prekeys exist', async () => {
            store.getFullRecord.mockResolvedValue(null);
            expect(await cryptoStorage.loadAllSignedPreKeys()).toBeUndefined();
        });

        it('stores signed prekey and persists its ID', async () => {
            await cryptoStorage.storeSignedPreKey(1, mockKeyPair);
            expect(store.upsertRecordItem).toHaveBeenCalledWith('signedPreKeys', '1', mockKeyPair);
            expect(store.setItem).toHaveBeenCalledWith('signedPreKeyId', 1);
        });

        it('removes signed prekey by ID', async () => {
            await cryptoStorage.removeSignedPreKey(1);
            expect(store.removeRecordItem).toHaveBeenCalledWith('signedPreKeys', '1');
        });

        it('stores and retrieves signed prekey ID', async () => {
            store.getItem.mockResolvedValue(42);
            await cryptoStorage.storeSignedPreKeyId(42);
            expect(store.setItem).toHaveBeenCalledWith('signedPreKeyId', 42);
            expect(await cryptoStorage.loadSignedPreKeyId()).toBe(42);
        });
    });

    describe('session management', () => {
        it('loads session by identifier', async () => {
            store.getRecordItem.mockResolvedValue('session-data');
            expect(await cryptoStorage.loadSession('user1.1')).toBe('session-data');
        });

        it('stores session', async () => {
            await cryptoStorage.storeSession('user1.1', 'session-data');
            expect(store.upsertRecordItem).toHaveBeenCalledWith('session', 'user1.1', 'session-data');
        });

        it('removes a specific session', async () => {
            await cryptoStorage.removeSession('user1.1');
            expect(store.removeRecordItem).toHaveBeenCalledWith('session', 'user1.1');
        });

        it('removes entire session record', async () => {
            await cryptoStorage.removeAllSessions();
            expect(store.removeItem).toHaveBeenCalledWith('session');
        });
    });

    describe('getSessionIdentifier', () => {
        it('formats as name.deviceId', () => {
            const mockAddress = { getName: () => 'user123', getDeviceId: () => 1 } as any;
            expect(cryptoStorage.getSessionIdentifier(mockAddress)).toBe('user123.1');
        });
    });

    describe('clearAll', () => {
        it('removes all key categories', async () => {
            await cryptoStorage.clearAll();
            ['identityKey', 'preKeys', 'recipientIdentityKeys', 'registrationId', 'session'].forEach(key => {
                expect(store.removeItem).toHaveBeenCalledWith(key);
            });
        });
    });

    describe('getInstance', () => {
        it('returns the same instance on repeated calls', () => {
            (CryptoStorage as any).instance = undefined;
            const a = CryptoStorage.getInstance('user123');
            const b = CryptoStorage.getInstance('user123');
            expect(a).toBe(b);
        });
    });
});