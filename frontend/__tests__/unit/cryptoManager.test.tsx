// tests/unit/crypto/cryptoManager.test.ts
import { CryptoManager } from '../../src/crypto/managers/CryptoManager';
import { ICryptoProvider } from '../../src/crypto/interfaces/ICryptoProvider';
import { IKeyApiService } from '../../src/crypto/interfaces/IKeyApiService';
import { KeyBundle, KeyStatistics, EncryptedMessage } from '../../src/crypto/types';

const mockKeyBundle: KeyBundle = {
    registrationId: 1,
    identityPubKey: new ArrayBuffer(32),
    signedPreKey: { keyId: 1, publicKey: new ArrayBuffer(32), signature: new ArrayBuffer(64) },
    oneTimePreKeys: [{ keyId: 1, publicKey: new ArrayBuffer(32) }],
};

const mockEncryptedMessage: EncryptedMessage = { type: 1, body: 'encrypted', registrationId: 1 };

const makeStats = (overrides: Partial<KeyStatistics> = {}): KeyStatistics => ({
    validPreKeyIds: [1, 2, 3],
    availablePreKeys: 100,
    signedPreKey: { keyId: 10, ageDays: 5, needsRotation: false },
    previousSignedPKID: 9,
    expiredSignedPKID: undefined,
    ...overrides,
});

describe('CryptoManager', () => {
    let mockCrypto: jest.Mocked<ICryptoProvider>;
    let mockApi: jest.Mocked<IKeyApiService>;
    let manager: CryptoManager;

    beforeEach(async () => {
        mockCrypto = {
            isNewUser: jest.fn(),
            setNewUser: jest.fn(),
            encryptMessage: jest.fn(),
            decryptMessage: jest.fn(),
            hasSession: jest.fn(),
            establishSession: jest.fn(),
            removeSession: jest.fn(),
            removeAllSessions: jest.fn(),
            generateKeyBundle: jest.fn(),
            regenerateSignedPreKey: jest.fn(),
            regeneratePreKeys: jest.fn(),
            cleanLocalPreKeys: jest.fn().mockResolvedValue(undefined),
            cleanLocalSignedPreKeys: jest.fn().mockResolvedValue(undefined),
        };

        mockApi = {
            uploadKeyBundle: jest.fn().mockResolvedValue(undefined),
            fetchRecipientKeyBundle: jest.fn(),
            rotateSignedPreKey: jest.fn().mockResolvedValue(undefined),
            uploadPreKeys: jest.fn().mockResolvedValue(undefined),
            getKeyStatistics: jest.fn(),
        };

        // new-user path avoids floating maintainKeys call
        mockCrypto.isNewUser.mockReturnValue(true);
        mockCrypto.generateKeyBundle.mockResolvedValue(mockKeyBundle);
        manager = await CryptoManager.initializeUser(mockCrypto, mockApi);
        jest.clearAllMocks();
    });

    describe('initializeUser', () => {
        it('generates and uploads key bundle for new user, marks as not-new', async () => {
            mockCrypto.isNewUser.mockReturnValue(true);
            mockCrypto.generateKeyBundle.mockResolvedValue(mockKeyBundle);

            await CryptoManager.initializeUser(mockCrypto, mockApi);

            expect(mockCrypto.generateKeyBundle).toHaveBeenCalled();
            expect(mockApi.uploadKeyBundle).toHaveBeenCalledWith(mockKeyBundle);
            expect(mockCrypto.setNewUser).toHaveBeenCalledWith(false);
        });

        it('skips key generation for existing user and triggers maintainKeys', async () => {
            mockCrypto.isNewUser.mockReturnValue(false);
            mockApi.getKeyStatistics.mockResolvedValue(makeStats());
            mockCrypto.regeneratePreKeys.mockResolvedValue([]);

            await CryptoManager.initializeUser(mockCrypto, mockApi);

            expect(mockCrypto.generateKeyBundle).not.toHaveBeenCalled();
            expect(mockCrypto.setNewUser).not.toHaveBeenCalled();
        });
    });

    describe('encryptMessage', () => {
        it('fetches key bundle and establishes session when none exists', async () => {
            mockCrypto.hasSession.mockResolvedValue(false);
            mockApi.fetchRecipientKeyBundle.mockResolvedValue(mockKeyBundle);
            mockCrypto.establishSession.mockResolvedValue(undefined);
            mockCrypto.encryptMessage.mockResolvedValue(mockEncryptedMessage);

            const result = await manager.encryptMessage('recipient1', 'hello');

            expect(mockApi.fetchRecipientKeyBundle).toHaveBeenCalledWith('recipient1');
            expect(mockCrypto.establishSession).toHaveBeenCalledWith('recipient1', mockKeyBundle);
            expect(result).toEqual(mockEncryptedMessage);
        });

        it('skips bundle fetch when session already exists', async () => {
            mockCrypto.hasSession.mockResolvedValue(true);
            mockCrypto.encryptMessage.mockResolvedValue(mockEncryptedMessage);

            await manager.encryptMessage('recipient1', 'hello');

            expect(mockApi.fetchRecipientKeyBundle).not.toHaveBeenCalled();
            expect(mockCrypto.establishSession).not.toHaveBeenCalled();
        });
    });

    describe('decryptMessage', () => {
        it('delegates to crypto provider and returns plaintext', async () => {
            mockCrypto.decryptMessage.mockResolvedValue('hello');

            const result = await manager.decryptMessage('sender1', mockEncryptedMessage);

            expect(mockCrypto.decryptMessage).toHaveBeenCalledWith('sender1', mockEncryptedMessage);
            expect(result).toBe('hello');
        });
    });

    describe('removeSession / removeAllSessions', () => {
        it('delegates removeSession to crypto provider', async () => {
            mockCrypto.removeSession.mockResolvedValue(undefined);
            await manager.removeSession('recipient1');
            expect(mockCrypto.removeSession).toHaveBeenCalledWith('recipient1');
        });

        it('delegates removeAllSessions to crypto provider', async () => {
            mockCrypto.removeAllSessions.mockResolvedValue(undefined);
            await manager.removeAllSessions();
            expect(mockCrypto.removeAllSessions).toHaveBeenCalled();
        });
    });

    describe('maintainKeys', () => {
        it('cleans local prekeys against server validPreKeyIds', async () => {
            mockApi.getKeyStatistics.mockResolvedValue(makeStats({ validPreKeyIds: [1, 2, 3] }));

            await manager.maintainKeys();

            expect(mockCrypto.cleanLocalPreKeys).toHaveBeenCalledWith([1, 2, 3]);
        });

        it('cleans local signed prekeys using current, previous, and expired IDs', async () => {
            mockApi.getKeyStatistics.mockResolvedValue(makeStats({
                signedPreKey: { keyId: 10, ageDays: 5, needsRotation: false },
                previousSignedPKID: 9,
                expiredSignedPKID: 8,
            }));

            await manager.maintainKeys();

            expect(mockCrypto.cleanLocalSignedPreKeys).toHaveBeenCalledWith([10, 9, 8]);
        });

        it('omits undefined signed prekey IDs from cleanup list', async () => {
            mockApi.getKeyStatistics.mockResolvedValue(makeStats({
                signedPreKey: { keyId: 10, ageDays: 5, needsRotation: false },
                previousSignedPKID: undefined,
                expiredSignedPKID: undefined,
            }));

            await manager.maintainKeys();

            expect(mockCrypto.cleanLocalSignedPreKeys).toHaveBeenCalledWith([10]);
        });

        it('replenishes prekeys by deficit, passing server IDs as excluded', async () => {
            mockApi.getKeyStatistics.mockResolvedValue(makeStats({
                availablePreKeys: 60,
                validPreKeyIds: [1, 2, 3],
            }));
            mockCrypto.regeneratePreKeys.mockResolvedValue([]);

            await manager.maintainKeys();

            expect(mockCrypto.regeneratePreKeys).toHaveBeenCalledWith(40, [1, 2, 3]);
            expect(mockApi.uploadPreKeys).toHaveBeenCalled();
        });

        it('rotates signed prekey when server flags needsRotation', async () => {
            mockApi.getKeyStatistics.mockResolvedValue(makeStats({
                signedPreKey: { keyId: 10, ageDays: 31, needsRotation: true },
            }));
            mockCrypto.regenerateSignedPreKey.mockResolvedValue({} as any);

            await manager.maintainKeys();

            expect(mockCrypto.regenerateSignedPreKey).toHaveBeenCalled();
            expect(mockApi.rotateSignedPreKey).toHaveBeenCalled();
        });

        it('skips replenishment and rotation when nothing is needed', async () => {
            mockApi.getKeyStatistics.mockResolvedValue(makeStats());

            await manager.maintainKeys();

            expect(mockCrypto.regeneratePreKeys).not.toHaveBeenCalled();
            expect(mockCrypto.regenerateSignedPreKey).not.toHaveBeenCalled();
        });
    });
});