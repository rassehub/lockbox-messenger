import { isAuthenticated } from '@/middleware/auth';
import { getRepository } from '@/db';
import { User } from '@/models/User';
import { Request, Response, NextFunction } from 'express';

// Mock dependencies
jest.mock('@/db', () => ({
  getRepository: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  User: class User {},
}));

describe('Auth Middleware - isAuthenticated', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let mockUserRepository: { findOne: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    mockUserRepository = {
      findOne: jest.fn(),
    };
    (getRepository as jest.Mock).mockReturnValue(mockUserRepository);

    mockReq = {
      session: {} as any,
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      sendStatus: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  it('should return 401 if no userId in session', async () => {
    // No session.userId set
    mockReq.session = {} as any;

    await isAuthenticated(
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(mockRes.sendStatus).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
    expect(getRepository).not.toHaveBeenCalled();
  });

  it('should return 403 if user not found in database', async () => {
    // Setup: userId exists but user not in DB
    mockReq.session = { userId: 'user-123' } as any;
    mockUserRepository.findOne.mockResolvedValue(null);

    await isAuthenticated(
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(mockUserRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'user-123' }
    });
    expect(mockRes.sendStatus).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() and set req.user if user found', async () => {
    // Setup: userId exists and user found
    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com'
    };
    
    mockReq.session = { userId: 'user-123' } as any;
    mockUserRepository.findOne.mockResolvedValue(mockUser);

    await isAuthenticated(
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(mockUserRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'user-123' }
    });
    expect(mockReq.user).toEqual(mockUser);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.sendStatus).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully', async () => {
    // Setup: database throws error
    const dbError = new Error('Database connection failed');
    mockReq.session = { userId: 'user-123' } as any;
    mockUserRepository.findOne.mockRejectedValue(dbError);

    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await isAuthenticated(
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'Auth middleware error:',
      dbError
    );
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockNext).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should handle null/undefined session object', async () => {
    // Edge case: session doesn't exist at all
    mockReq.session = undefined as any;

    await isAuthenticated(
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(mockRes.sendStatus).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  // If your middleware also checks for user properties
  it('should handle user with missing required fields', async () => {
    mockReq.session = { userId: 'user-123' } as any;
    
    // User found but missing expected fields
    mockUserRepository.findOne.mockResolvedValue({
      id: 'user-123'
      // missing username, etc.
    });

    await isAuthenticated(
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    // Should still work if only id is required
    expect(mockReq.user).toBeDefined();
    expect(mockNext).toHaveBeenCalled();
  });
});
