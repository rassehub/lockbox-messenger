import './setupDb'; // Ensures DB is initialized before tests
import { AppDataSource, initDb, closeDb } from "@/db";

// Mock the logger to avoid console output during tests
jest.mock('@/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));


describe("Database Connection", () => {
  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(async () => {
  });
  it("should connect to the database", async () => {

    expect(AppDataSource.isInitialized).toBe(true);
  });

});