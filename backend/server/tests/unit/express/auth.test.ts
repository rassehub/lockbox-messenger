import { login, logout } from '@/controllers/authController';
import bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

// Mock the map from expressApp
jest.mock('@/config/expressApp', () => ({
  map: new Map(),
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

jest.mock('@/db', () => ({
  getRepository: jest.fn(() => ({
    findOne: jest.fn().mockResolvedValue({ 
      id: 'user-123',
      phone_number: '12345', 
      password_hash: '$2b$10$hashedpassword' 
    }),
  })),
}));

describe ('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log in successfully with valid credentials', async () => {
    // Mock bcrypt.compare to return true for correct password
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const req = {
      body: { phoneNumber: '12345', password: 'password' },
      session: {}
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    } as any;

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ 
      result: 'OK', 
      message: 'Session updated', 
      userId: 'user-123' 
    });
  });

  it('should fail to log in with invalid credentials', async () => {
    // Mock bcrypt.compare to return false for wrong password
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const req = {
      body: { phoneNumber: '12345', password: 'wrongpassword' },
      session: {}
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
  });

  it('should log out successfully', () => {
    const req = {
      session: { 
        userId: 'user-123',
        destroy: jest.fn((cb) => cb(null)) 
      }
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    } as any;

    logout(req, res);

    expect(req.session.destroy).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith({ result: 'OK', message: 'Session destroyed' });
  });

  it('should handle logout when not authenticated', () => {
    const req = {
      session: {}
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as any;

    logout(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });
}
);