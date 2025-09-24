import { User } from "./api";

type AuthStoreOptions = {
  storageKey?: string;
};

interface LocalStorageLike {
  setItem(key: string, value: string): void;
  getItem(key: string): string | null;
  removeItem(key: string): void;
}

interface TokenStorage {
  set(token: string): void;
  get(): string | null;
  remove(): void;
}

export interface AuthStore {
  // Save token (persisted) and user (in-memory only)
  setLoggedInUser(authentication_token?: string | null, user?: User | null): void;
  getLoggedInUser(): User | null;
  getAuthorizationToken(): string | null;
  isUserLoggedIn(): boolean;
}

export function createAuthStore(
  options: AuthStoreOptions = {}
): AuthStore {
  const STORAGE_KEY = options.storageKey ?? 'auth.token';

  // Fallback-safe storage that prefers localStorage, falls back to in-memory
  const storage: TokenStorage = (() => {
    let available = false;
    let ls: LocalStorageLike | undefined;

    try {
      const g = globalThis as unknown as { localStorage?: LocalStorageLike } | undefined;
      if (g && g.localStorage) {
        ls = g.localStorage;
        const t = '__auth_store_test__';
        ls.setItem(t, '1');
        ls.removeItem(t);
        available = true;
      }
    } catch {
      available = false;
    }

    let memoryToken: string | null = null;

    return {
      set(token: string) {
        if (available && ls) ls.setItem(STORAGE_KEY, token);
        else memoryToken = token;
      },
      get() {
        if (available && ls) return ls.getItem(STORAGE_KEY);
        return memoryToken;
      },
      remove() {
        if (available && ls) ls.removeItem(STORAGE_KEY);
        else memoryToken = null;
      },
    };
  })();

  // User is kept only in memory (not persisted)
  let inMemoryUser: User | null = null;

  return {
    setLoggedInUser(authentication_token?: string | null, user?: User | null) {
      if (typeof authentication_token === 'string' && authentication_token.length > 0) {
        storage.set(authentication_token);
      } else {
        // If no valid token provided, clear stored token
        storage.remove();
      }
      // Store user only in memory (session-scoped)
      inMemoryUser = user ?? null;
    },
    getLoggedInUser() {
      return inMemoryUser;
    },
    getAuthorizationToken() {
      return storage.get();
    },
    isUserLoggedIn() {
      const token = storage.get();
      return typeof token === 'string' && token.length > 0;
    },
  };
}
