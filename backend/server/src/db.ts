import "reflect-metadata";
import { DataSource, EntityTarget, ObjectLiteral } from "typeorm";
import { User } from "./models/User";
import logger from "./utils/logger";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "lockbox-db",
  port: 5432,
  username: "dbuser",
  password: "dbpass",
  database: "lockbox_dev",
  synchronize: true, // Auto-creates tables (disable in prod)
  logging: true,
  entities: [User],
});

export function getRepository<T extends ObjectLiteral>(entity: EntityTarget<T>) {
  return AppDataSource.getRepository(entity);
}

let initPromise: Promise<DataSource> | null = null;

export async function initDb(): Promise<DataSource> {


  if (initPromise) {
    return initPromise;
  }

  // Already initialized
  if (AppDataSource.isInitialized) {
    return AppDataSource;
  }

  if (process.env.NODE_ENV === 'development') {
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
}