import { apiRequest } from './client';

/** Texts a 6-digit code. Resolves to { sent, expiresInSeconds, resendInSeconds, devOtp? } (devOtp only in dev servers). */
export function sendOtp(phone, purpose = 'REGISTER') {
  return apiRequest('/auth/otp/send', { method: 'POST', body: { phone, purpose } });
}

/** Checks the code the user typed. Throws an ApiError (e.g. "Incorrect code.") when it is not valid. */
export function verifyOtp(phone, otp, purpose = 'REGISTER') {
  return apiRequest('/auth/otp/verify', { method: 'POST', body: { phone, purpose, otp } });
}
