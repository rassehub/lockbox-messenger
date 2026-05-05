import session from 'express-session';
const RedisStore = eval('require')('connect-redis').RedisStore;
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
  const store = new RedisStore({ client: getCache() });
  return session({
    store,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || '$eCuRiTy',
    resave: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24,
    },
  });
}