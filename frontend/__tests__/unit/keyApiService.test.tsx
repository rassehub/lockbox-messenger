// tests/unit/crypto/keyApiService.test.ts
import { KeyApiService } from '../../src/crypto/services/KeyApiService';
import { ApiClient } from '../../src/api/apiClient';
import { KeyBundle, KeyStatistics } from '../../src/crypto/types';
import { SignedPublicPreKeyType } from '@privacyresearch/libsignal-protocol-typescript';

describe('KeyApiService', () => {
    let service: KeyApiService;
    let mockApiClient: { makeRequest: jest.Mock };

    const ok = { ok: true, statusText: 'OK' };
    const fail = { ok: false, statusText: 'Internal Server Error' };

    const mockKeyBundle: KeyBundle = {
        registrationId: 1,
        identityPubKey: new ArrayBuffer(32),
        signedPreKey: { keyId: 1, publicKey: new ArrayBuffer(32), signature: new ArrayBuffer(64) },
        oneTimePreKeys: [],
    };

    const mockSignedPreKey: SignedPublicPreKeyType = {
        keyId: 1,
        publicKey: new ArrayBuffer(32),
        signature: new ArrayBuffer(64),
    };

    const mockStats: KeyStatistics = {
        validPreKeyIds: [1, 2, 3],
        availablePreKeys: 80,
        signedPreKey: { keyId: 10, ageDays: 5, needsRotation: false },
        previousSignedPKID: 9,
        expiredSignedPKID: undefined,
    };

    beforeEach(() => {
        mockApiClient = { makeRequest: jest.fn() };
        service = new KeyApiService(mockApiClient as unknown as ApiClient);
    });

    describe('uploadKeyBundle', () => {
        it('resolves on success', async () => {
            mockApiClient.makeRequest.mockResolvedValue({ rawResponse: ok });
            await expect(service.uploadKeyBundle(mockKeyBundle)).resolves.toBeUndefined();
            expect(mockApiClient.makeRequest).toHaveBeenCalledWith('uploadKeyBundle', { keyBundle: mockKeyBundle });
        });

        it('throws statusText on HTTP error', async () => {
            mockApiClient.makeRequest.mockResolvedValue({ rawResponse: fail });
            await expect(service.uploadKeyBundle(mockKeyBundle)).rejects.toThrow('Internal Server Error');
        });
    });

    describe('fetchRecipientKeyBundle', () => {
        it('returns key bundle from response data', async () => {
            mockApiClient.makeRequest.mockResolvedValue({ rawResponse: ok, data: { keyBundle: mockKeyBundle } });

            const result = await service.fetchRecipientKeyBundle('user1');

            expect(result).toEqual(mockKeyBundle);
            expect(mockApiClient.makeRequest).toHaveBeenCalledWith('fetchRecipientKeyBundle', { recipientId: 'user1' });
        });

        it('throws when keyBundle is absent', async () => {
            mockApiClient.makeRequest.mockResolvedValue({ rawResponse: fail, data: {} });
            await expect(service.fetchRecipientKeyBundle('user1')).rejects.toThrow();
        });
    });

    describe('rotateSignedPreKey', () => {
        it('resolves on success', async () => {
            mockApiClient.makeRequest.mockResolvedValue({ rawResponse: ok });
            await expect(service.rotateSignedPreKey(mockSignedPreKey)).resolves.toBeUndefined();
        });

        it('throws statusText on HTTP error', async () => {
            mockApiClient.makeRequest.mockResolvedValue({ rawResponse: fail });
            await expect(service.rotateSignedPreKey(mockSignedPreKey)).rejects.toThrow('Internal Server Error');
        });
    });

    describe('uploadPreKeys', () => {
        it('resolves on success', async () => {
            mockApiClient.makeRequest.mockResolvedValue({ rawResponse: ok });
            await expect(service.uploadPreKeys([])).resolves.toBeUndefined();
        });

        it('throws statusText on HTTP error', async () => {
            mockApiClient.makeRequest.mockResolvedValue({ rawResponse: fail });
            await expect(service.uploadPreKeys([])).rejects.toThrow('Internal Server Error');
        });
    });

    describe('getKeyStatistics', () => {
        it('returns KeyStatistics on success', async () => {
            mockApiClient.makeRequest.mockResolvedValue({ rawResponse: ok, data: mockStats });

            const result = await service.getKeyStatistics();

            expect(result).toEqual(mockStats);
            expect(mockApiClient.makeRequest).toHaveBeenCalledWith('fetchKeyStatistics');
        });

        it('throws when data is absent', async () => {
            mockApiClient.makeRequest.mockResolvedValue({ rawResponse: fail, data: null });
            await expect(service.getKeyStatistics()).rejects.toThrow();
        });
    });
});