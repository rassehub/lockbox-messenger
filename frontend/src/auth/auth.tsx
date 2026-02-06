import { ApiClient } from "src/api/apiClient";
import { AuthStorage } from "./authStorage";
import { createApiFacade } from "../utils/createApiFacade";


type SessionCookies = {
  sessionToken: string;
  refreshToken: string;
}

type AuthContext = {
  headers?: Record<string, string>;
  cookies?: string;
}

class AuthService {
  private sessionToken?: string;
  private refreshToken?: string;
  private userId?: string;

  private authStatus: boolean = false;

  private store: AuthStorage;
  private api: ReturnType<typeof createApiFacade>;

  constructor(api: ApiClient) {
    this.store = new AuthStorage;
    api._bindAuth(this);
    this.api = createApiFacade(
      ["registerUser", "login", "logout", "fetchCurrentUser"] as const,
      api
    );
  }

  private apiAdapter!: {
    setAuthContext(ctx?: AuthContext): void;
  };

  _attachApi(adapter: { setAuthContext(ctx?: AuthContext): void }) {
    this.apiAdapter = adapter;
  }

  private applySessionToApi(session: SessionCookies) {
    this.apiAdapter.setAuthContext({
      headers: {
        'Content-Type': 'application/json',
        'Cookie': session.sessionToken,
      },
      cookies: session.sessionToken,
    });
  };

  private removeSessionFromApi() {
    this.apiAdapter.setAuthContext({
      headers: undefined,
      cookies: undefined,
    });
  }

  private async setNewAuthSession(userId: string, session: string, refresh: string) {
    await this.store.storeAuthSession(session, refresh, userId);
    await this.store.setLatestUser(userId);

    this.userId = userId;
    this.sessionToken = session;
    this.refreshToken = refresh;
  }

  async isAuthenticated() {
    return { status: this.authStatus, userId: this.userId }
  }

  async loadExistingSession(): Promise<string | undefined> {
    const session = await this.store.loadExistingSession();
    if(session) {
      this.userId = session.userId;
      this.sessionToken = session.sessionToken;
      this.refreshToken = session.refreshToken;

      this.applySessionToApi({
        sessionToken: session.sessionToken,
        refreshToken: session.refreshToken
      })

      return session.userId;
    }
    return undefined;
  }

  async register(username: string, phoneNumber: string, password: string) {
    let setCookie;
    let userId;

    const res = await this.api.request("registerUser", {
      username: username,
      phoneNumber: phoneNumber,
      password: password
    })
    
    if (!res.rawResponse.ok) {
      throw new Error(` ${res.rawResponse.statusText}`);
    }
    
    setCookie = res.headers.get("set-cookie");
    userId = res.data.userId;
    
    if (setCookie && userId) {
      await this.setNewAuthSession(userId, setCookie,  "");
      console.log(`SUCCESS: register user ${userId}`);
      return userId;
    }
    else
      throw new Error("FAIL: can't initialize session");
  }

  async login(phoneNumber: string, password: string) {
    let setCookie;
    let userId;
    
    const res = await this.api.request("login", { phoneNumber, password })

    if (!res.rawResponse.ok) {
      throw new Error(`FAIL: login failed with error: ${res.rawResponse.statusText}`);
    }
    
    setCookie = res.headers.get("set-cookie");
    userId = res.data.userId;

    if (setCookie && userId) {
      await this.setNewAuthSession(userId, setCookie,  "");
      console.log(`SUCCESS: login user ${userId}`);
      return userId;
    }
    else
      throw new Error("FAIL: can't initialize session");
  }

  async logout() {
    const res = await this.api.request("logout");
    if(res.rawResponse.ok && this.userId) {
      this.store.removeAuthSession(this.userId);
      this.sessionToken = undefined; // Clear session
      this.refreshToken = undefined;
      this.userId = undefined;
    }
    this.removeSessionFromApi();
  }

  async getMe() {
    const userId = await this.api.request("fetchCurrentUser");
    return userId
  }
}

export { AuthService };