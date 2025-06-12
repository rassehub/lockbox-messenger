import request from 'supertest';
import { app } from '../../src/server/expressApp';
import logger from '../../src/services/logger';

// Mock the logger to avoid console output during tests
jest.mock('../../src/services/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('Express App', () => {
  it('POST /login creates a session', async () => {
    const response = await request(app)
      .post('/login')
      .expect(200);

    expect(response.body).toEqual({
      result: 'OK',
      message: 'Session updated',
    });

    // Check if the logger was called
    expect(logger.info).toHaveBeenCalledWith(
      'Updating session',
      expect.objectContaining({ userId: expect.any(String) })
    );
  });

  it('DELETE /logout destroys the session', async () => {
    // First, log in to get a session
    const agent = request.agent(app);
    await agent.post('/login');

    // Then, log out
    const response = await agent
      .delete('/logout')
      .expect(200);

    expect(response.body).toEqual({
      result: 'OK',
      message: 'Session destroyed',
    });
  });
});