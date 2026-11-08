import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'unideliver_session_token';

/**
 * Session token persistence (SR07).
 * Native: Keychain / Keystore via expo-secure-store. Web: localStorage.
 * Only used when the user ticks "Remember me"; otherwise the token lives in memory.
 */
export const tokenStorage = {
  async get(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') return globalThis.localStorage?.getItem(KEY) ?? null;
      return await SecureStore.getItemAsync(KEY);
    } catch {
      return null;
    }
  },

  async set(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') globalThis.localStorage?.setItem(KEY, token);
      else await SecureStore.setItemAsync(KEY, token);
    } catch (err) {
      console.warn('[tokenStorage] Could not persist session:', err);
    }
  },

  async clear(): Promise<void> {
    try {
      if (Platform.OS === 'web') globalThis.localStorage?.removeItem(KEY);
      else await SecureStore.deleteItemAsync(KEY);
    } catch {
      // nothing to clear
    }
  },
};
