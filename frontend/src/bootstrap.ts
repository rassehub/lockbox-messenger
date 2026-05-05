// bootstrap.ts
import { MasterKeyStore } from './storage/masterKeyStore';
import { HttpClient } from './http/HttpClient';
import { AuthService } from './auth/auth';
import { ApiClient } from './api/apiClient';
import { WebSocketService } from './realtime/websocket';
import { KeyApiService } from './crypto/services/KeyApiService';
import { CryptoStorage } from './crypto/storage/CryptoStorage';
import { ChatStorage } from './chat/chatStorage';
import { CryptoProvider } from './crypto/services/CryptoProvider';
import { CryptoManager } from './crypto/managers/CryptoManager';

export interface AppSession {
  userId: string;
  auth: AuthService;
  api: ApiClient;
  ws: WebSocketService;
  keyApi: KeyApiService;
  cryptoStorage: CryptoStorage;
  chatStorage: ChatStorage;
  cryptoProvider: CryptoProvider;
  cryptoManager: CryptoManager;
}

// Returned when no existing session is found — caller handles login/register,
// then calls completeInit() with the acquired userId.
export interface PartialSession {
  auth: AuthService;
  completeInit: (userId: string) => Promise<AppSession>;
}

export async function bootstrap(serverUrl: string): Promise<AppSession | PartialSession> {

  // ── 1. Device-level key store ──────────────────────────────────────────────
  // Singleton. Must run before any SecureStorage is constructed.
  const keyStore = MasterKeyStore.getInstance();
  await keyStore.init();

  // ── 2. Network + auth ──────────────────────────────────────────────────────
  // AuthStorage is constructed inside AuthService.
  const transport = new HttpClient(serverUrl);
  const auth = new AuthService(transport);

  // ── 3. Try to restore existing session ────────────────────────────────────
  const userId = await auth.loadExistingSession();

  if (!userId) {
    // Caller must call auth.login() or auth.register(), then completeInit().
    return {
      auth,
      completeInit: (userId: string) => completeInit(userId, auth, transport),
    };
  }

  return completeInit(userId, auth, transport);
}

// Builds everything that depends on a known userId.
async function completeInit(
  userId: string,
  auth: AuthService,
  transport: HttpClient
): Promise<AppSession> {

  // ── 4. API clients ─────────────────────────────────────────────────────────
  const api = new ApiClient(auth, transport);
  const ws = new WebSocketService(auth);
  const keyApi = new KeyApiService(api);

  // ── 5. Per-user storage ────────────────────────────────────────────────────
  // Namespaced by userId. MasterKeyStore is already initialized (step 1).
  const cryptoStorage = new CryptoStorage(userId);
  const chatStorage = new ChatStorage(userId);

  // ── 6. Crypto layer ────────────────────────────────────────────────────────
  // initializeLocalIdentity: loads keys from storage, or generates + stores them (new user).
  // initializeUser:          if new user → uploads key bundle via keyApi, starts key maintenance loop.
  const cryptoProvider = await CryptoProvider.initializeLocalIdentity(cryptoStorage, userId);
  const cryptoManager = await CryptoManager.initializeUser(cryptoProvider, keyApi);

  return { userId, auth, api, ws, keyApi, cryptoStorage, chatStorage, cryptoProvider, cryptoManager };
}