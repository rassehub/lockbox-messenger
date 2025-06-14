import { login, logout } from '../../../src/controllers/authController';

jest.mock('../../../src/db', () => ({
  getRepository: jest.fn(() => ({
    findOne: jest.fn().mockResolvedValue({ username: 'admin', password_hash: 'password' }),
  })),
}));

describe ('Auth Controller', () => {
  it('should log in successfully with valid credentials', async () => {
    const req = {
      body: { username: 'admin', password: 'password' },
      session: {}
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Login successful' });
  });

  it('should fail to log in with invalid credentials', async () => {
    const req = {
      body: { username: 'admin', password: 'wrongpassword' },
      session: {}
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
  });

  it('should log out successfully', () => {
    const req = {
      session: { destroy: jest.fn((cb) => cb(null)) }
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;

    logout(req, res);

    expect(req.session.destroy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Logout successful' });
  });

  it('should handle logout failure', () => {
    const req = {
      session: { destroy: jest.fn((cb) => cb(new Error('Logout failed'))) }
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;

    logout(req, res);

    expect(req.session.destroy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Logout failed' });
  });
}
);