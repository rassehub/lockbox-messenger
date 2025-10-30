import { AppDataSource, initDb, closeDb } from "@/db";

describe("Database Connection", () => {
  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it("should connect to the database", async () => {

    expect(AppDataSource.isInitialized).toBe(true);
  });

});