import { AuthService } from "../../src/auth/auth";
import { CryptoManager } from "../../src/crypto/managers/cryptoManager";
import { ApiClient } from "../../src/api/apiClient";

describe('Authentication related functions and api-calls', () => {
    const alice = {
        userId: "",
        username: `liisa${Math.floor(Math.random() * 16777215)}`,
        phoneNumber: String(Math.floor(Math.random() * 16777215)),
        password: "notsosecure",
        api: new ApiClient(),
        auth: undefined as AuthService | undefined,
        crypto: undefined as CryptoManager | undefined,
    }
    alice.auth = new AuthService(alice.api);

    it('registers successfully:', async () => {
        const userId = await alice.auth?.register(alice.username, alice.phoneNumber, alice.password);
        expect(userId).toBeDefined;
    });
    it('is logged in after registering:', async () => {
        const userId = await alice.auth?.getMe();
        expect(userId).toBeDefined;
    });
    it('logs out succesfully:', async () => {
        const res = await alice.auth?.logout();
        //const userId = await alice.auth?.getMe();
        //expect(userId).toBeUndefined;
    });
    it('logs back in succcesfully:', async () => {
        const userId = await alice.auth?.login(alice.phoneNumber, alice.password);
        expect(userId).toBeDefined;
        const fetchedUserId = await alice.auth?.getMe();
        expect(fetchedUserId).toBeDefined;
        if(userId)
            alice.userId = userId;
    });
    it('initializes cryptomanager succesfully', async () => {
        alice.crypto = new CryptoManager(alice.userId, alice.api)
        const result = await alice.crypto.initializeNewUser();
        expect(result).toBeTruthy;
        const keyStats = await alice.api.makeRequest("fetchMyKeyStatistics");
        expect(keyStats).toBeDefined;
        expect(keyStats.data.availablePreKeys).toBeGreaterThan(1);
    });

});