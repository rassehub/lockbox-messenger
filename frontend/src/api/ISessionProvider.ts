export interface ISessionProvider {
  getSessionToken(): string | undefined;
  getRefreshToken(): string | undefined;
}