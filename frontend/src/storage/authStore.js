import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_KEY = 'pump_auth_session_v3';

// The sign-in tokens go in the device keychain/keystore on phones; the web has no secure store, so it falls back to local storage.
const secure = Platform.OS !== 'web';

/** The saved { token, refreshToken }, or null when nobody is signed in. */
export async function getSession() {
  try {
    const raw = secure ? await SecureStore.getItemAsync(SESSION_KEY) : await AsyncStorage.getItem(SESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.token && parsed?.refreshToken ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveSession({ token, refreshToken }) {
  const raw = JSON.stringify({ token, refreshToken });
  if (secure) await SecureStore.setItemAsync(SESSION_KEY, raw);
  else await AsyncStorage.setItem(SESSION_KEY, raw);
}

export async function clearSession() {
  try {
    if (secure) await SecureStore.deleteItemAsync(SESSION_KEY);
    else await AsyncStorage.removeItem(SESSION_KEY);
  } catch {
    // nothing stored, or the store is unavailable: either way there is no session left to clear
  }
}
