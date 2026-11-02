import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'pump_auth_token_v2';

// The sign-in token goes in the device keychain/keystore on phones; the web has no secure store, so it falls back to local storage.
const secure = Platform.OS !== 'web';

export async function getToken() {
  try {
    return (secure ? await SecureStore.getItemAsync(TOKEN_KEY) : await AsyncStorage.getItem(TOKEN_KEY)) || null;
  } catch {
    return null;
  }
}

export async function saveToken(token) {
  if (secure) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken() {
  try {
    if (secure) await SecureStore.deleteItemAsync(TOKEN_KEY);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // nothing stored, or the store is unavailable: either way there is no session left to clear
  }
}
