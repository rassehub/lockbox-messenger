import { AuthService } from '../../services/auth';

const API_BASE = 'http://127.0.0.1:3000'; // Real server must be running

describe('Auth API Integration', () => {
  let authService: AuthService;

  beforeAll(async () => {
    // Optional: Verify server is reachable
    try {
      const res = await fetch(API_BASE);
      if (!res.ok && res.status !== 404) {
        throw new Error('Server not reachable');
      }
    } catch (err) {
      throw new Error('Server must be running on localhost:3000 for integration tests');
    }
  });

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('POST /register', () => {
    it('creates a new user and returns success', async () => {
      const username = `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const displayName = `User ${Date.now()}`;
      const password = 'password123';

      const result = await authService.register(username, displayName, password);

      expect(result).toMatchObject({
        result: 'Created',
        message: expect.stringContaining('registered')
      });
    });

    it('returns 409 when username already exists', async () => {
      const username = `duplicate_${Date.now()}`;
      const displayName = 'Duplicate User';
      const password = 'password123';

      await authService.register(username, displayName, password);
      
      // Second registration should fail
      await expect(
        authService.register(username, displayName, password)
      ).rejects.toThrow(/409|already registered/i);
    });

    it('returns 400 for missing required fields', async () => {
      await expect(
        authService.register('', '', '')
      ).rejects.toThrow(/400|missing/i);
    });
  });

  describe('POST /login', () => {
    it('returns session token for valid credentials', async () => {
      const username = `login_${Date.now()}`;
      const displayName = `Login User ${Date.now()}`;
      const password = 'password123';

      // First register
      await authService.register(username, displayName, password);

      // Then login
      const result = await authService.login(username, displayName, password);

      expect(result).toMatchObject({
        result: 'OK',
        userId: expect.any(String)
      });
    });

    it('returns 401 for invalid credentials', async () => {
      await expect(
        authService.login('nonexistent', 'Nonexistent', 'wrongpass')
      ).rejects.toThrow(/401|invalid/i);
    });
  });

  describe('DELETE /logout', () => {
    it('destroys session successfully', async () => {
      const username = `logout_${Date.now()}`;
      const displayName = `Logout User ${Date.now()}`;
      const password = 'password123';

      await authService.register(username, displayName, password);
      await authService.login(username, displayName, password);

      const result = await authService.logout();

      expect(result).toMatchObject({
        result: 'OK',
        message: expect.stringContaining('destroyed')
      });
    });
  });
describe('GET /me', () => {
  it('returns user info when authenticated', async () => {
    const username = `me_${Date.now()}`;
    const displayName = `Me User ${Date.now()}`;
    const password = 'password123';

    // First register (sets session cookie internally)
    await authService.register(username, displayName, password);

    // Then getMe (uses stored cookie)
    const result = await authService.getMe();

    expect(result).toMatchObject({
      userId: expect.any(String)
    });
  });

  it('returns 401 when not authenticated', async () => {
    const unauthService = new AuthService(); // Fresh instance, no session

    await expect(unauthService.getMe()).rejects.toThrow('Unauthorized');
  });
});
});