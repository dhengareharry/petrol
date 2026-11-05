// Indian mobile numbers: 10 digits, the first of which is 6, 7, 8 or 9. (The server enforces the same rule.)
export const isValidMobile = (value) => /^[6-9]\d{9}$/.test(value);

/** What a phone field should hold after the user types or pastes: digits only, no +91 / leading 0, at most 10 digits. */
export function cleanPhoneInput(value) {
  let digits = String(value).replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

/** A short hint for a number that is not valid yet, or '' when there is nothing to say (empty, or valid). `t` translates it. */
export function mobileHint(value, t) {
  if (!value || isValidMobile(value)) return '';
  if (!/^[6-9]/.test(value)) return t('phone.hintStart');
  return t('phone.hintMore', { n: 10 - value.length });
}
