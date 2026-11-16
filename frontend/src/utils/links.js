import { Linking } from 'react-native';
import { API_ORIGIN } from '../config';

/** Opens the privacy policy page that the backend serves (the same one the Google Play listing links to). */
export function openPrivacyPolicy() {
  return Linking.openURL(`${API_ORIGIN}/privacy`).catch(() => undefined);
}
