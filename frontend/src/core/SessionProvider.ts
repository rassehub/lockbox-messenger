export interface SessionProvider {
  getSessionToken(): string | undefined;
  getRefreshToken(): string | undefined;
}