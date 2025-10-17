import { closeDb } from '../src/db';
import { closeCache } from '../src/services/redis';

export default async function globalTeardown() {
  try {
    await closeCache();
    await closeDb();
  } catch (error) {
  }
}