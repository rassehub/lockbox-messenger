import { searchUser } from '@/controllers/socialControllers'

jest.mock('@/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
}));

// Mock the db module but make it configurable
jest.mock('@/db', () => ({
    getRepository: jest.fn()
}));

// Import the mocked module
import { getRepository } from '@/db';

describe('Social Controllers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should handle user not found', async () => {
        // Mock findOne to return null (user not found)
        (getRepository as jest.Mock).mockReturnValue({
            findOne: jest.fn().mockResolvedValue(null)
        });

        const req = {
            body: { username: 'fakeguy' },
            session: {}
        } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any;

        await searchUser(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'User not found'
        });
    });

    it('should return user when found', async () => {
        // Mock findOne to return a user
        (getRepository as jest.Mock).mockReturnValue({
            findOne: jest.fn().mockResolvedValue({
                id: 'recipient-123',
                username: 'someguy'
            })
        });

        const req = {
            body: { username: 'someguy' },
            session: {}
        } as any;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any;

        await searchUser(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            userId: 'recipient-123'
        });
    });
});