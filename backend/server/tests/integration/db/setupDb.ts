import { initDb, closeDb } from "@/db";

beforeAll(async () => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  await initDb();
});

afterAll(async () => {
  await closeDb();
});