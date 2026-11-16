import { MIN_STAFF_PASSWORD_LENGTH } from '../rules';

// The same limits the server enforces, so a mistake is caught on the screen with a clear message instead of after a round trip.
export const MAX_FUEL_RUPEES = 200000;
export const MAX_FUEL_LITRES = 2000;

/** The first problem with a staff account's fields, or '' when they are fine. `passwordRequired` is false when editing. */
export function staffFieldsError({ name, username, password, passwordRequired }) {
  const trimmedName = name.trim();
  const trimmedUser = username.trim();
  if (!trimmedName) return 'Enter the full name.';
  if (trimmedName.length > 100) return 'The name can be at most 100 characters.';
  if (!/^[a-z0-9._]{3,20}$/i.test(trimmedUser)) return 'Username must be 3-20 characters: letters, numbers, dot or underscore.';
  if (/^\d+$/.test(trimmedUser)) return 'Username cannot be only digits.';
  if (passwordRequired || password) {
    if (password.length < MIN_STAFF_PASSWORD_LENGTH) return `Password must be at least ${MIN_STAFF_PASSWORD_LENGTH} characters.`;
    if (password.length > 100) return 'Password can be at most 100 characters.';
  }
  return '';
}
