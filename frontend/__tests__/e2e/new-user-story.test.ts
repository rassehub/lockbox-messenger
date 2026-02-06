import { AuthService } from "../../src/auth/auth";
import { CryptoManager } from "../../src/crypto/managers/cryptoManager";
import { ApiClient } from "../../src/api/apiClient";

describe('Authentication related functions and api-calls', () => {
    const alice = {
        userId: "",
        username: "liisaaass",
        phoneNumber: "1234536",
        password: "notsosecure",
        api: new ApiClient(),
        auth: undefined as AuthService | undefined,
        crypto: undefined as CryptoManager | undefined,
    }
    alice.api = new ApiClient();
    alice.auth = new AuthService(alice.api);
    alice.crypto = new CryptoManager(alice.userId, alice.api);

    it('registers successfully:', async () => {
        const userId = await alice.auth?.register(alice.username, alice.phoneNumber, alice.password);
        expect(userId).toBeDefined;
    });
    it('is logged in after registering:', async () => {
        const userId = await alice.auth?.getMe();
        expect(userId).toBeDefined;
    });
    it('logs out succesfully:', async () => {
        await alice.auth?.logout;
        const userId = await alice.auth?.getMe();
        expect(userId).toBeUndefined;
    })
    it('logs back in succcesfully:', async () => {
        const userId = await alice.auth?.login(alice.phoneNumber, alice.password);
        expect(userId).toBeDefined;
        const fetchedUserId = await alice.auth?.getMe();
        expect(fetchedUserId).toBeDefined;
    })
});