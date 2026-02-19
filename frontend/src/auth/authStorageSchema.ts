type AuthStorageSchema = {
  sessions: Record<string, {
    session: string;
    refresh: string;
  }>;
  latestSession: string;
};

export default AuthStorageSchema;