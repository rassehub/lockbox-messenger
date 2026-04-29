// tests/unit/crypto/cryptoProvider.test.ts
import { CryptoProvider } from '../../src/crypto/services/CryptoProvider';
import { ICryptoStorage } from '../../src/crypto/interfaces/ICryptoStorage';
import { SessionCipher, SessionBuilder, SignalProtocolAddress } from '@privacyresearch/libsignal-protocol-typescript';
import * as utils from '../../src/crypto/utils/index';

jest.mock('@privacyresearch/libsignal-protocol-typescript', () => ({
    SessionCipher: jest.fn(),
    SessionBuilder: jest.fn(),
    SignalProtocolAddress: jest.fn().mockImplementation((name: string, deviceId: number) => ({
        getName: () => name,
        getDeviceId: () => deviceId,
    })),
}));

jest.mock('../../src/crypto/utils/index', () => ({
    keys: {
        generateRegistrationId: jest.fn(),
        generateIdentityKeyPair: jest.fn(),
        generateSignedPreKey: jest.fn(),
        signedPreKeyToPublic: jest.fn(),
        generatePreKeysFromIds: jest.fn(),
        preKeyArrayToPublic: jest.fn(),
        generateKeyId: jest.fn(),
    },
    buffer: {
        stringToArrayBuffer: jest.fn(),
        arrayBufferToString: jest.fn(),
    },
}));

const mockKeyPair = { pubKey: new ArrayBuffer(32), privKey: new ArrayBuffer(32) };
const mockSignedPreKey = { keyId: 1, publicKey: new ArrayBuffer(32), signature: new ArrayBuffer(64) };

describe('CryptoProvider', () => {
    let mockStorage: jest.Mocked<ICryptoStorage>;
    let provider: CryptoProvider;

    const mockCipherInstance = {
        encrypt: jest.fn(),
        decryptPreKeyWhisperMessage: jest.fn(),
        decryptWhisperMessage: jest.fn(),
    };

    const mockBuilderInstance = { processPreKey: jest.fn() };

    const initExistingUser = async () => {
        mockStorage.getLocalRegistrationId.mockResolvedValueOnce(12345);
        mockStorage.getIdentityKeyPair.mockResolvedValueOnce(mockKeyPair);
        return CryptoProvider.initializeLocalIdentity(mockStorage, 'user123');
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        mockStorage = {
            getIdentityKeyPair: jest.fn(),
            getLocalRegistrationId: jest.fn(),
            storeIdentityKeyPair: jest.fn().mockResolvedValue(undefined),
            storeLocalRegistrationId: jest.fn().mockResolvedValue(undefined),
            isTrustedIdentity: jest.fn().mockResolvedValue(true),
            saveIdentity: jest.fn().mockResolvedValue(false),
            loadIdentityKey: jest.fn(),
            loadPreKey: jest.fn(),
            loadAllPreKeys: jest.fn(),
            storePreKey: jest.fn().mockResolvedValue(undefined),
            storePreKeys: jest.fn().mockResolvedValue(undefined),
            removePreKey: jest.fn().mockResolvedValue(undefined),
            replacePreKeys: jest.fn().mockResolvedValue(undefined),
            loadSignedPreKey: jest.fn(),
            loadAllSignedPreKeys: jest.fn(),
            storeSignedPreKey: jest.fn().mockResolvedValue(undefined),
            removeSignedPreKey: jest.fn().mockResolvedValue(undefined),
            storeSignedPreKeyId: jest.fn().mockResolvedValue(undefined),
            loadSignedPreKeyId: jest.fn(),
            loadSession: jest.fn(),
            storeSession: jest.fn().mockResolvedValue(undefined),
            removeSession: jest.fn().mockResolvedValue(undefined),
            removeAllSessions: jest.fn().mockResolvedValue(undefined),
            getSessionIdentifier: jest.fn().mockReturnValue('user123.1'),
            clearAll: jest.fn().mockResolvedValue(undefined),
        };

        (SessionCipher as jest.Mock).mockImplementation(() => mockCipherInstance);
        (SessionBuilder as jest.Mock).mockImplementation(() => mockBuilderInstance);

        provider = await initExistingUser();
    });

    describe('initializeLocalIdentity', () => {
        it('generates and stores keys for new user', async () => {
            mockStorage.getLocalRegistrationId.mockResolvedValueOnce(undefined);
            mockStorage.getIdentityKeyPair.mockResolvedValueOnce(undefined);
            (utils.keys.generateRegistrationId as jest.Mock).mockReturnValue(99999);
            (utils.keys.generateIdentityKeyPair as jest.Mock).mockResolvedValue(mockKeyPair);

            const newProvider = await CryptoProvider.initializeLocalIdentity(mockStorage, 'newUser');

            expect(mockStorage.storeLocalRegistrationId).toHaveBeenCalledWith(99999);
            expect(mockStorage.storeIdentityKeyPair).toHaveBeenCalledWith(mockKeyPair);
            expect(newProvider.isNewUser()).toBe(true);
        });

        it('skips generation when keys exist and marks as existing user', () => {
            expect(utils.keys.generateRegistrationId).not.toHaveBeenCalled();
            expect(utils.keys.generateIdentityKeyPair).not.toHaveBeenCalled();
            expect(provider.isNewUser()).toBe(false);
        });
    });

    describe('isNewUser / setNewUser', () => {
        it('reflects status changes', () => {
            provider.setNewUser(true);
            expect(provider.isNewUser()).toBe(true);
            provider.setNewUser(false);
            expect(provider.isNewUser()).toBe(false);
        });
    });

    describe('hasSession', () => {
        it('returns true when session record exists', async () => {
            mockStorage.loadSession.mockResolvedValue('session-record');
            expect(await provider.hasSession('recipient1')).toBe(true);
        });

        it('returns false when no session exists', async () => {
            mockStorage.loadSession.mockResolvedValue(undefined);
            expect(await provider.hasSession('recipient1')).toBe(false);
        });
    });

    describe('encryptMessage', () => {
        it('encrypts and returns message with registrationId', async () => {
            mockStorage.loadSession.mockResolvedValue('session-record');
            mockStorage.getLocalRegistrationId.mockResolvedValue(12345);
            (utils.buffer.stringToArrayBuffer as jest.Mock).mockReturnValue(new ArrayBuffer(8));
            mockCipherInstance.encrypt.mockResolvedValue({ type: 1, body: 'ciphertext' });

            const result = await provider.encryptMessage('recipient1', 'hello');

            expect(result).toEqual({ type: 1, body: 'ciphertext', registrationId: 12345 });
        });

        it('throws when no session exists', async () => {
            mockStorage.loadSession.mockResolvedValue(undefined);
            await expect(provider.encryptMessage('recipient1', 'hello'))
                .rejects.toThrow('No session exists with recipient1');
        });
    });

    describe('decryptMessage', () => {
        beforeEach(() => {
            (utils.buffer.arrayBufferToString as jest.Mock).mockReturnValue('plaintext');
        });

        it('uses decryptPreKeyWhisperMessage for type 3', async () => {
            mockCipherInstance.decryptPreKeyWhisperMessage.mockResolvedValue(new ArrayBuffer(8));
            const result = await provider.decryptMessage('sender1', { type: 3, body: 'cipher', registrationId: 1 });
            expect(mockCipherInstance.decryptPreKeyWhisperMessage).toHaveBeenCalledWith('cipher');
            expect(result).toBe('plaintext');
        });

        it('uses decryptWhisperMessage for type 1', async () => {
            mockCipherInstance.decryptWhisperMessage.mockResolvedValue(new ArrayBuffer(8));
            const result = await provider.decryptMessage('sender1', { type: 1, body: 'cipher', registrationId: 1 });
            expect(mockCipherInstance.decryptWhisperMessage).toHaveBeenCalledWith('cipher');
            expect(result).toBe('plaintext');
        });

        it('throws for unknown message type', async () => {
            await expect(provider.decryptMessage('sender1', { type: 99, body: 'cipher', registrationId: 1 }))
                .rejects.toThrow('Unknown message type: 99');
        });
    });

    describe('establishSession', () => {
        it('processes prekey bundle with first one-time prekey', async () => {
            const keyBundle = {
                registrationId: 1,
                identityPubKey: new ArrayBuffer(32),
                signedPreKey: mockSignedPreKey,
                oneTimePreKeys: [{ keyId: 1, publicKey: new ArrayBuffer(32) }],
            };
            mockBuilderInstance.processPreKey.mockResolvedValue(undefined);

            await provider.establishSession('recipient1', keyBundle);

            expect(mockBuilderInstance.processPreKey).toHaveBeenCalledWith(
                expect.objectContaining({
                    registrationId: 1,
                    identityKey: keyBundle.identityPubKey,
                    signedPreKey: keyBundle.signedPreKey,
                    preKey: keyBundle.oneTimePreKeys[0],
                })
            );
        });
    });

    describe('removeSession / removeAllSessions', () => {
        it('resolves identifier and removes session', async () => {
            mockStorage.getSessionIdentifier.mockReturnValue('recipient1.1');
            await provider.removeSession('recipient1');
            expect(mockStorage.removeSession).toHaveBeenCalledWith('recipient1.1');
        });

        it('delegates removeAllSessions to storage', async () => {
            await provider.removeAllSessions();
            expect(mockStorage.removeAllSessions).toHaveBeenCalled();
        });
    });

    describe('regenerateSignedPreKey', () => {
        it('generates, stores, and returns public signed prekey', async () => {
            (utils.keys.generateKeyId as jest.Mock).mockReturnValue(42);
            (utils.keys.generateSignedPreKey as jest.Mock).mockResolvedValue({ keyPair: mockKeyPair });
            (utils.keys.signedPreKeyToPublic as jest.Mock).mockResolvedValue(mockSignedPreKey);

            const result = await provider.regenerateSignedPreKey();

            expect(mockStorage.storeSignedPreKey).toHaveBeenCalledWith(42, mockKeyPair);
            expect(mockStorage.storeSignedPreKeyId).toHaveBeenCalledWith(42);
            expect(result).toEqual(mockSignedPreKey);
        });
    });

    describe('regeneratePreKeys', () => {
        it('generates incrementally from 1 when no IDs are excluded', async () => {
            (utils.keys.generatePreKeysFromIds as jest.Mock).mockResolvedValue([]);
            (utils.keys.preKeyArrayToPublic as jest.Mock).mockReturnValue([]);

            await provider.regeneratePreKeys(3, []);

            expect(utils.keys.generatePreKeysFromIds).toHaveBeenCalledWith([1, 2, 3]);
        });

        it('skips excluded IDs and continues incrementally', async () => {
            (utils.keys.generatePreKeysFromIds as jest.Mock).mockResolvedValue([]);
            (utils.keys.preKeyArrayToPublic as jest.Mock).mockReturnValue([]);

            await provider.regeneratePreKeys(3, [1, 2]);

            expect(utils.keys.generatePreKeysFromIds).toHaveBeenCalledWith([3, 4, 5]);
        });

        it('handles non-contiguous exclusions correctly', async () => {
            (utils.keys.generatePreKeysFromIds as jest.Mock).mockResolvedValue([]);
            (utils.keys.preKeyArrayToPublic as jest.Mock).mockReturnValue([]);

            await provider.regeneratePreKeys(3, [1, 3, 5]);

            expect(utils.keys.generatePreKeysFromIds).toHaveBeenCalledWith([2, 4, 6]);
        });

        it('stores generated prekeys', async () => {
            const generated = [{ keyId: 1, keyPair: mockKeyPair }];
            (utils.keys.generatePreKeysFromIds as jest.Mock).mockResolvedValue(generated);
            (utils.keys.preKeyArrayToPublic as jest.Mock).mockReturnValue([]);

            await provider.regeneratePreKeys(1, []);

            expect(mockStorage.storePreKeys).toHaveBeenCalledWith(generated);
        });
    });

    describe('cleanLocalPreKeys', () => {
        it('removes local prekeys not present in validIds', async () => {
            mockStorage.loadAllPreKeys.mockResolvedValue([
                { keyId: 1, keyPair: mockKeyPair },
                { keyId: 2, keyPair: mockKeyPair },
                { keyId: 3, keyPair: mockKeyPair },
            ]);

            await provider.cleanLocalPreKeys([1, 3]);

            expect(mockStorage.removePreKey).toHaveBeenCalledWith(2);
            expect(mockStorage.removePreKey).toHaveBeenCalledTimes(1);
        });

        it('removes nothing when all local keys are valid', async () => {
            mockStorage.loadAllPreKeys.mockResolvedValue([
                { keyId: 1, keyPair: mockKeyPair },
            ]);

            await provider.cleanLocalPreKeys([1, 2, 3]);

            expect(mockStorage.removePreKey).not.toHaveBeenCalled();
        });

        it('returns early when no local prekeys exist', async () => {
            mockStorage.loadAllPreKeys.mockResolvedValue(undefined);
            await provider.cleanLocalPreKeys([1, 2, 3]);
            expect(mockStorage.removePreKey).not.toHaveBeenCalled();
        });
    });

    describe('cleanLocalSignedPreKeys', () => {
        it('removes local signed prekeys not in validIds', async () => {
            mockStorage.loadAllSignedPreKeys.mockResolvedValue([
                { keyId: 10, keyPair: mockKeyPair },
                { keyId: 9, keyPair: mockKeyPair },
                { keyId: 8, keyPair: mockKeyPair },
            ]);

            await provider.cleanLocalSignedPreKeys([10, 9]);

            expect(mockStorage.removeSignedPreKey).toHaveBeenCalledWith(8);
            expect(mockStorage.removeSignedPreKey).toHaveBeenCalledTimes(1);
        });

        it('returns early when no local signed prekeys exist', async () => {
            mockStorage.loadAllSignedPreKeys.mockResolvedValue(undefined);
            await provider.cleanLocalSignedPreKeys([10]);
            expect(mockStorage.removeSignedPreKey).not.toHaveBeenCalled();
        });
    });

    describe('generateKeyBundle', () => {
        it('calls regeneratePreKeys with empty exclusion list on first generation', async () => {
            (utils.keys.generateKeyId as jest.Mock).mockReturnValue(1);
            (utils.keys.generateSignedPreKey as jest.Mock).mockResolvedValue({ keyPair: mockKeyPair });
            (utils.keys.signedPreKeyToPublic as jest.Mock).mockResolvedValue(mockSignedPreKey);
            (utils.keys.generatePreKeysFromIds as jest.Mock).mockResolvedValue([]);
            (utils.keys.preKeyArrayToPublic as jest.Mock).mockReturnValue([]);

            const bundle = await provider.generateKeyBundle();

            expect(utils.keys.generatePreKeysFromIds).toHaveBeenCalledWith(
                Array.from({ length: 100 }, (_, i) => i + 1)
            );
            expect(bundle).toMatchObject({
                registrationId: 12345,
                identityPubKey: mockKeyPair.pubKey,
                signedPreKey: mockSignedPreKey,
            });
        });
    });
});