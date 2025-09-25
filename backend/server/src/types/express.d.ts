import { User } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: User; // Or use a minimal type like { id: string }
    }
  }
}