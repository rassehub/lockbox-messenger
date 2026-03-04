import { searchUser } from '@/controllers/socialControllers'

jest.mock('@/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
}));

// Mock the db module with a configurable findOne
jest.mock('@/db', () => ({
    getRepository: jest.fn()
}));

// Import the mocked module
import { getRepository } from '@/db';


describe('Social Controllers', () => {
    let mockFindOne: jest.Mock;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mock repository with configurable findOne
        mockFindOne = jest.fn();
        (getRepository as jest.Mock).mockReturnValue({
            findOne: mockFindOne
        });

        // Suppress console.error in tests
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it('should handle user not found', async () => {
        // Mock findOne to return null (user not found)
        mockFindOne.mockResolvedValue(null);

        const req = {
            body: { username: 'fakeguy' },
            session: {}
        } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any;

        await searchUser(req, res);

        expect(mockFindOne).toHaveBeenCalledWith({ 
            where: { username: 'fakeguy' } 
        });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'User not found'
        });
    });

    it('should return user when found', async () => {
        // Mock findOne to return a user
        const mockUser = {
            id: 'recipient-123',
            username: 'someguy'
        };
        mockFindOne.mockResolvedValue(mockUser);

        const req = {
            body: { username: 'someguy' },
            session: {}
        } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any;

        await searchUser(req, res);

        expect(mockFindOne).toHaveBeenCalledWith({ 
            where: { username: 'someguy' } 
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            userId: 'recipient-123'
        });
    });

    it('should handle database connection errors', async () => {
        // Mock findOne to throw a database error
        const dbError = new Error('Database connection failed');
        mockFindOne.mockRejectedValue(dbError);

        const req = {
            body: { username: 'someguy' },
            session: {}
        } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any;

        await searchUser(req, res);

        // Verify error was logged
        expect(console.error).toHaveBeenCalledWith(
            'Error searching for user:', 
            dbError
        );
        
        // Verify response is 500 with error message
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error searching for user'
        });
        
        // Verify findOne was called
        expect(mockFindOne).toHaveBeenCalledWith({ 
            where: { username: 'someguy' } 
        });
    });

    it('should handle unexpected errors', async () => {
        // Mock findOne to throw a non-Error object
        const unexpectedError = 'Something went wrong';
        mockFindOne.mockRejectedValue(unexpectedError);

        const req = {
            body: { username: 'someguy' },
            session: {}
        } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any;

        await searchUser(req, res);

        // Verify error was logged
        expect(console.error).toHaveBeenCalledWith(
            'Error searching for user:', 
            unexpectedError
        );
        
        // Verify response is 500 with error message
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Error searching for user'
        });
    });
});