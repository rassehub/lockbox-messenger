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

export async function initDb() {

  if (process.env.NODE_ENV === 'development') {
    AppDataSource.setOptions({ logging: false }); // or logging: []
  }
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    logger.info("PostgreSQL connected");
  }
}

// Export a destroyer for cleanup
export async function closeDb() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}