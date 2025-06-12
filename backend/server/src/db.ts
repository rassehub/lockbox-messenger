import "reflect-metadata";
import { DataSource } from "typeorm";
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

// Initialize connection
AppDataSource.initialize()
  .then(() => console.log("PostgreSQL connected"))
  .catch(console.error);