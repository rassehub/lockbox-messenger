import { ApiClient } from "src/api/apiClient";
import { AuthStorage } from "./authStorage";
import { createApiFacade } from "../utils/createApiFacade";
import { SessionProvider } from "../core/SessionProvider";
import { HttpClient } from "../core/http";

/*
    POSSIBLE IDEAS:
    -set userId so that it will not get stored
      -relogin will send getMe request with stored session token, which will send userId
    -implement refresh token so that if it gets sent with expired session token new ones will be issued
*/
class AuthService implements SessionProvider {
  private sessionToken?: string;
  private refreshToken?: string;
  private userId?: string;

  private authStatus: boolean = false;

  private store: AuthStorage;

  constructor(private http: HttpClient) {
    this.store = new AuthStorage;

  }

  getSessionToken(): string | undefined {
    return this.sessionToken;
  }

  getRefreshToken(): string | undefined {
    return this.refreshToken;
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

      return session.userId;
    }
    return undefined;
  }

  async register(username: string, phoneNumber: string, password: string) {
    let setCookie;
    let userId;

    const res = await this.http.send({
      url: "/auth/register",
      method: "POST",
      headers: { "Content-Type":  "application/json"},
      body: JSON.stringify({username, phoneNumber, password})
    })
    
    if (!res.ok) {
      throw new Error(`Error: ${res.statusText}`);
    }
    
    setCookie = res.headers.get("set-cookie");
    
    const data = await res.json();
    userId = data.userId ? data.userId : null;

    if (setCookie && userId) {
      await this.setNewAuthSession(userId, setCookie,  "");
      console.log(`SUCCESS: register user ${userId}`);
      return userId;
    }
    else
      throw new Error("FAIL: can't initialize session for user: ${userId}");
  }

  async login(phoneNumber: string, password: string) {
    let setCookie;
    let userId;

    const res = await this.http.send({
      url: "/auth/login",
      method: "POST",
      headers: { "Content-Type":  "application/json"},
      body: JSON.stringify({phoneNumber, password})
    })
    
    if (!res.ok) {
      throw new Error(`Error: ${res.statusText}`);
    }
    
    setCookie = res.headers.get("set-cookie");
    
    const data = await res.json();
    userId = data.userId ? data.userId : null;

    if (setCookie && userId) {
      await this.setNewAuthSession(userId, setCookie,  "");
      console.log(`SUCCESS: login user ${userId}`);
      return userId;
    }
    else
      throw new Error(`FAIL: can't initialize session for user: ${userId}`);
  }

  async logout() {
    const res = await this.http.send({
      url: "/auth/logout",
      method: "DELETE",
      headers: {
         "Content-Type":  "application/json",
         'Cookie': this.sessionToken ? this.sessionToken : "",
      }
    })
    
    if (!res.ok) {
      throw new Error(`Error: ${res.statusText}`);
    }
    
    if(res.ok && this.userId) {
      this.store.removeAuthSession(this.userId);
      console.log(`SUCCESS: logged out user: ${this.userId}`);
      this.sessionToken = undefined; // Clear session
      this.refreshToken = undefined;
      this.userId = undefined;
    }
  }

  async getMe() {
    let userId;
    const res = await this.http.send({
      url: "/auth/me",
      method: "GET",
      headers: {
         "Content-Type":  "application/json",
         'Cookie': this.sessionToken ? this.sessionToken : "",
      }
    })
    
    if (!res.ok) {
      throw new Error(`Error: ${res.statusText}`);
    }

    const data = await res.json();
    userId = data.userId ? data.userId : null;

    return userId
  }
}

export { AuthService };