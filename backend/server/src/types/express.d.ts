import { User } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

// This export is required to make this file a module
export {};