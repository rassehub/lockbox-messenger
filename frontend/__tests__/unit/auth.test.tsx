import { AuthService } from '../../src/auth/auth';

// Mock fetch globally
global.fetch = jest.fn();

describe('AuthService', () => {
    let authService: AuthService;

    beforeEach(() => {
        authService = new AuthService();
        (global.fetch as jest.Mock).mockClear();
    });
    
describe('register', () => {
  it('should register a user successfully and store session', async () => {
    const mockResponse = { result: 'Created', message: 'User registered', userId: '123' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'set-cookie': 'sessionToken=abc123; Path=/' }),
      json: async () => mockResponse,
    });

    const result = await authService.register('testuser', 'Test User', 'password123');
    
    // Expect the response to include sessionCookie
    expect(result).toEqual({
      ...mockResponse,
      sessionCookie: 'sessionToken=abc123'
    });
  });

  it('should handle registration failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 409,
      headers: new Headers(),
      json: async () => ({ error: 'username already registered' }),
    });

    await expect(
      authService.register('existinguser', 'Existing User', 'password123')
    ).rejects.toThrow('username already registered');
  });
});

describe('login', () => {
  it('should login a user successfully', async () => {
    const mockResponse = { result: 'OK', userId: '123' };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'set-cookie': 'sessionToken=abc123; Path=/' }),
      json: async () => mockResponse,
    });

    const result = await authService.login('12345', 'password123');

    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '12345', password: 'password123' }),
    });
    
    // Expect the response to include sessionCookie
    expect(result).toEqual({
      ...mockResponse,
      sessionCookie: 'sessionToken=abc123'
    });
  });

  it('should handle login failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers(),
      json: async () => ({ error: 'Invalid credentials' }),
    });

    await expect(
      authService.login('12345', 'wrongpassword')
    ).rejects.toThrow('Invalid credentials');
  });
});

describe('getMe', () => {
  it('should send stored cookie with request', async () => {
    // First set up a session by mocking login
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'set-cookie': 'sessionToken=abc123; Path=/' }),
      json: async () => ({ result: 'OK', userId: '123' }),
    });

    await authService.login('12345', 'password123');

    // Then mock getMe
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({ userId: '123', username: 'testuser' }),
    });

    await authService.getMe();

    // Verify Cookie header was sent
    expect(global.fetch).toHaveBeenLastCalledWith(
      'http://127.0.0.1:3000/api/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: 'sessionToken=abc123'
        })
      })
    );
  });
});
});