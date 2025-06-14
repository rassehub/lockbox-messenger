import session from 'express-session';

// Extend express-session types
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<session.SessionData>;
    }
  }
}

// Export the session parser middleware
const sessionParser = session({
  saveUninitialized: false,
  secret: '$eCuRiTy',
  resave: false
});

export default sessionParser;