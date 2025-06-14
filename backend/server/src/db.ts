import "reflect-metadata";
import { DataSource, EntityTarget, ObjectLiteral } from "typeorm";
import { User } from "./models/User";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "yourpassword",
  database: "e2ee_chat",
  synchronize: true, // Auto-creates tables (disable in prod)
  logging: true,
  entities: [User],
});

export function getRepository<T extends ObjectLiteral>(entity: EntityTarget<T>) {
  return AppDataSource.getRepository(entity);
}

// Initialize connection
AppDataSource.initialize()
  .then(() => console.log("PostgreSQL connected"))
  .catch(console.error);

