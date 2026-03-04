import { getUserId, searchUsers } from '@/controllers/socialControllers';
import { getRepository } from '@/db';
import { User } from '@/models/User';
import { Request, Response } from 'express';

jest.mock('@/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
}));


describe('Social Controllers - Integration Tests', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let consoleErrorSpy: jest.SpyInstance;
    
    // Store test users to clean up later
    const testUsers: User[] = [];

    beforeAll(async () => {
        // Create test users in database
        const repo = getRepository(User);
        
        // Create 5 test users with random usernames
        for (let i = 0; i < 5; i++) {
            const user = repo.create({
                username: `testuser_${Math.random().toString(36).substring(7)}`,
                password_hash: 'testhash',
                phone_number: `+1234567${i}${Math.random().toString().substring(2, 5)}`,
                signal_key_bundle: null
            });
            const saved = await repo.save(user);
            testUsers.push(saved);
        }

        // Create some users with similar names for search testing
        const baseNames = ['john_doe', 'john_smith', 'johnson', 'jonathan', 'johanna'];
        for (const name of baseNames) {
            const user = repo.create({
                username: name,
                password_hash: 'testhash',
                phone_number: `+1${Math.random().toString().substring(2, 11)}`,
                signal_key_bundle: null
            });
            const saved = await repo.save(user);
            testUsers.push(saved);
        }
    });

    afterAll(async () => {
        // Clean up test users
        const repo = getRepository(User);
        for (const user of testUsers) {
            await repo.delete(user.id);
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockReq = {
            body: {},
            session: { userId: testUsers[0]?.id } // Use first test user as authenticated user
        } as any;
        
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any;

        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('Get userId by username', () => {
        it('should return userId when username exists', async () => {
            const testUser = testUsers[0];
            
            mockReq.body = { username: testUser.username };

            await getUserId(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                userId: testUser.id
            });
        });

        it('should return 404 when username does not exist', async () => {
            mockReq.body = { username: 'nonexistentuser123456' };

            await getUserId(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found'
            });
        });
    });

    describe('Search users by username', () => {
        it('should return matching usernames based on partial search', async () => {
            mockReq.body = { username: 'john' };

            await searchUsers(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            
            // Get the actual response
            const jsonResponse = (mockRes.json as jest.Mock).mock.calls[0][0];
            
            expect(jsonResponse.success).toBe(true);
            expect(jsonResponse.users).toBeInstanceOf(Array);
            
            // Should find at least the john-related users
            expect(jsonResponse.users.length).toBeGreaterThanOrEqual(3);
            
            // All returned usernames should contain 'john' (case insensitive check)
            jsonResponse.users.forEach((username: string) => {
                expect(username.toLowerCase()).toContain('john');
            });
        });

        it('should return empty array when no users match', async () => {
            mockReq.body = { username: 'xyzabc123nonexistent' };

            await searchUsers(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                users: []
            });
        });

        it('should limit results to 20 users', async () => {
            // Create many users with same base name
            const repo = getRepository(User);
            const extraUsers: User[] = [];
            
            // Create 25 users with 'bulk' in username
            for (let i = 0; i < 25; i++) {
                const user = repo.create({
                    username: `bulk_user_${i}`,
                    password_hash: 'testhash',
                    phone_number: `+${i}${Math.random().toString().substring(2, 11)}`,
                    signal_key_bundle: null
                });
                const saved = await repo.save(user);
                extraUsers.push(saved);
                testUsers.push(saved); // Add to cleanup list
            }

            mockReq.body = { username: 'bulk' };

            await searchUsers(mockReq as Request, mockRes as Response);

            const jsonResponse = (mockRes.json as jest.Mock).mock.calls[0][0];
            
            expect(jsonResponse.success).toBe(true);
            expect(jsonResponse.users.length).toBeLessThanOrEqual(20);
        });

        it('should handle empty search term', async () => {
            mockReq.body = { username: '' };

            await searchUsers(mockReq as Request, mockRes as Response);

            // Should return some users (maybe all, or handle gracefully)
            expect(mockRes.status).toHaveBeenCalledWith(200);
            const jsonResponse = (mockRes.json as jest.Mock).mock.calls[0][0];
            expect(jsonResponse.success).toBe(true);
            expect(Array.isArray(jsonResponse.users)).toBe(true);
        });
    });
});