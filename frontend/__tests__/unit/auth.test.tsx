import { AuthService } from '../../src/auth/auth';
import { AuthStorage } from '../../src/auth/authStorage';
import { IHttpClient } from '../../src/http/IHttpClient';

jest.mock('../../src/auth/authStorage');

const MockedAuthStorage = AuthStorage as jest.MockedClass<typeof AuthStorage>;

// Helper to build a mock HTTP response
const mockResponse = (
  ok: boolean,
  statusText: string,
  setCookie: string | null,
  body: object
): Response => ({
  ok,
  statusText,
  headers: { get: (key: string) => (key === 'set-cookie' ? setCookie : null) } as unknown as Headers,
  json: async () => body,
} as unknown as Response);

describe('AuthService', () => {
  let authService: AuthService;
  let mockHttp: jest.Mocked<IHttpClient>;
  let storageInstance: jest.Mocked<AuthStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockHttp = { send: jest.fn() };
    authService = new AuthService(mockHttp);
    storageInstance = MockedAuthStorage.mock.instances[0] as jest.Mocked<AuthStorage>;
  });

  // Reusable login setup (not re-testing login, just establishing state)
  const setupLoggedInSession = async () => {
    mockHttp.send.mockResolvedValueOnce(
      mockResponse(true, 'OK', 'sessionToken=abc123', { userId: '123' })
    );
    await authService.login('12345', 'password123');
  };

  describe('register', () => {
    it('returns userId and stores session on success', async () => {
      mockHttp.send.mockResolvedValueOnce(
        mockResponse(true, 'OK', 'sessionToken=abc123', { userId: '123' })
      );
      const userId = await authService.register('testuser', '12345', 'password123');

      expect(userId).toBe('123');
      expect(storageInstance.storeAuthSession).toHaveBeenCalledWith('sessionToken=abc123', '', '123');
      expect(storageInstance.setLatestUser).toHaveBeenCalledWith('123');
    });

    it('throws on HTTP error using statusText', async () => {
      mockHttp.send.mockResolvedValueOnce(mockResponse(false, 'Conflict', null, {}));
      await expect(authService.register('testuser', '12345', 'password123'))
        .rejects.toThrow('Error: Conflict');
    });

    it('throws when set-cookie is missing', async () => {
      mockHttp.send.mockResolvedValueOnce(
        mockResponse(true, 'OK', null, { userId: '123' })
      );
      await expect(authService.register('testuser', '12345', 'password123'))
        .rejects.toThrow("FAIL: can't initialize session");
    });

    it('throws when userId is missing from response', async () => {
      mockHttp.send.mockResolvedValueOnce(
        mockResponse(true, 'OK', 'sessionToken=abc123', {})
      );
      await expect(authService.register('testuser', '12345', 'password123'))
        .rejects.toThrow("FAIL: can't initialize session");
    });
  });

  describe('login', () => {
    it('returns userId and stores session on success', async () => {
      mockHttp.send.mockResolvedValueOnce(
        mockResponse(true, 'OK', 'sessionToken=abc123', { userId: '123' })
      );
      const userId = await authService.login('12345', 'password123');

      expect(userId).toBe('123');
      expect(storageInstance.storeAuthSession).toHaveBeenCalledWith('sessionToken=abc123', '', '123');
    });

    it('throws on HTTP error using statusText', async () => {
      mockHttp.send.mockResolvedValueOnce(mockResponse(false, 'Unauthorized', null, {}));
      await expect(authService.login('12345', 'wrongpassword'))
        .rejects.toThrow('Error: Unauthorized');
    });

    it('throws when response is missing cookie or userId', async () => {
      mockHttp.send.mockResolvedValueOnce(
        mockResponse(true, 'OK', 'sessionToken=abc123', {})
      );
      await expect(authService.login('12345', 'password123'))
        .rejects.toThrow("FAIL: can't initialize session");
    });
  });

  describe('logout', () => {
    it('clears in-memory session and removes stored auth on success', async () => {
      await setupLoggedInSession();

      mockHttp.send.mockResolvedValueOnce(mockResponse(true, 'OK', null, {}));
      await authService.logout();

      expect(storageInstance.removeAuthSession).toHaveBeenCalledWith('123');
      expect(authService.getSessionToken()).toBeUndefined();
      expect(authService.getRefreshToken()).toBeUndefined();
    });

    it('throws on HTTP error', async () => {
      mockHttp.send.mockResolvedValueOnce(mockResponse(false, 'Unauthorized', null, {}));
      await expect(authService.logout()).rejects.toThrow('Error: Unauthorized');
    });
  });

  describe('getMe', () => {
    it('sends session cookie and returns userId', async () => {
      await setupLoggedInSession();

      mockHttp.send.mockResolvedValueOnce(
        mockResponse(true, 'OK', null, { userId: '123' })
      );
      const result = await authService.getMe();

      expect(result).toBe('123');
      expect(mockHttp.send).toHaveBeenLastCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({ Cookie: 'sessionToken=abc123' }),
        })
      );
    });

    it('throws on HTTP error', async () => {
      mockHttp.send.mockResolvedValueOnce(mockResponse(false, 'Unauthorized', null, {}));
      await expect(authService.getMe()).rejects.toThrow('Error: Unauthorized');
    });
  });

  describe('loadExistingSession', () => {
    it('restores session from storage and returns userId', async () => {
      storageInstance.loadExistingSession.mockResolvedValueOnce({
        userId: '123',
        sessionToken: 'sessionToken=abc123',
        refreshToken: '',
      });

      const userId = await authService.loadExistingSession();

      expect(userId).toBe('123');
      expect(authService.getSessionToken()).toBe('sessionToken=abc123');
    });

    it('returns undefined when no stored session exists', async () => {
      storageInstance.loadExistingSession.mockResolvedValueOnce(undefined);
      const userId = await authService.loadExistingSession();
      expect(userId).toBeUndefined();
    });
  });

  describe('isAuthenticated', () => {
    it('returns false and undefined userId before any session is established', async () => {
      const result = await authService.isAuthenticated();
      expect(result).toEqual({ status: false, userId: undefined });
    });
  });
});