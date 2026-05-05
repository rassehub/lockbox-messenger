import session from 'express-session';
import RedisStore from 'connect-redis';
import { getCache } from '../services/redis';

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<session.SessionData>;
    }
  }
}

export function createSessionParser() {
  return session({
    store: new RedisStore({ client: getCache() }),
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || '$eCuRiTy',
    resave: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24,
    },
  });
}