import "reflect-metadata";
import { DataSource, EntityTarget, ObjectLiteral } from "typeorm";
import { PreKey, User } from "./models/User";
import logger from "./utils/logger";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database:process.env.DB_NAME,
  synchronize: process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development', // Auto-creates tables (disable in prod)
  dropSchema: process.env.NODE_ENV === 'test', // Clean slate for each test run
  logging: true,
  entities: [
    User,
    PreKey
  ],
});

export function getRepository<T extends ObjectLiteral>(entity: EntityTarget<T>) {
  return AppDataSource.getRepository(entity);
}

export function getDataSource(): DataSource {
  if (!AppDataSource.isInitialized) {
    throw new Error('DataSource is not initialized. Call initDb() first.');
  }
  return AppDataSource;
}

let initPromise: Promise<DataSource> | null = null;

export async function initDb(): Promise<DataSource> {

  console.trace('initDb called from:');
  
  // If already initialized, return immediately
  if (AppDataSource.isInitialized) {
    return AppDataSource;
  }
  
  // If initialization is in progress, wait for it
  if (initPromise) {
    return initPromise;
  }

  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    AppDataSource.setOptions({ logging: false }); // or logging: []
  }
  initPromise = AppDataSource.initialize()
    .then(() => {
      logger.info('PostgreSQL connected');
      return AppDataSource;
    })
    .catch((err) => {
      logger.error('DB initialization failed', err);
      initPromise = null; // Reset on failure
      throw err;
    });

  return initPromise
}

// Export a destroyer for cleanup
export async function closeDb() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  initPromise = null;
}