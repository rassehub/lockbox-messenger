import session from 'express-session';
const RedisStore = require('connect-redis');
import Redis from 'ioredis';

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

const redisClient = new Redis(process.env.REDIS_URL || 'redis://:cachepass@cache:6379');
const store = new RedisStore({ client: redisClient });
const sessionParser = session({
  store,
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET || '$eCuRiTy',
  resave: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24, // 24h
  },
});

export default sessionParser;