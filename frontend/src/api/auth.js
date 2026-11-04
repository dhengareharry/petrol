import { apiRequest } from './client';

export const loginCustomer = (phone, pin) => apiRequest('/auth/customer/login', { method: 'POST', body: { phone, pin } });

export const loginStaff = (username, password) =>
  apiRequest('/auth/staff/login', { method: 'POST', body: { username, password } });

/** Sign-up rules that don't need the SMS code, so bad details are rejected before a paid code is sent. */
export const checkRegistration = ({ phone, vehicleModel, vehicleNumber, referredByPhone }) =>
  apiRequest('/auth/register/check', {
    method: 'POST',
    body: {
      phone,
      ...(vehicleNumber || vehicleModel ? { vehicle: { number: vehicleNumber, model: vehicleModel || undefined } } : {}),
      ...(referredByPhone ? { referralCode: referredByPhone } : {}),
    },
  });

/** Creates the account in the database. `otp` (the code texted to `phone`) is only sent when SMS verification is on. */
export const registerCustomer = ({ name, phone, pin, otp, vehicleModel, vehicleNumber, referredByPhone }) =>
  apiRequest('/auth/customer/register', {
    method: 'POST',
    body: {
      name,
      phone,
      pin,
      ...(otp ? { otp } : {}),
      ...(vehicleNumber || vehicleModel ? { vehicle: { number: vehicleNumber, model: vehicleModel || undefined } } : {}),
      ...(referredByPhone ? { referralCode: referredByPhone } : {}),
    },
  });

/** Who does this token belong to? Used to restore a saved session. */
export const fetchMe = () => apiRequest('/auth/me');

export const resetCustomerPin = (phone, otp, newPin) =>
  apiRequest('/auth/customer/reset-pin', { method: 'POST', body: { phone, otp, newPin } });

/** Ends this device's session on the server (best effort; the app clears its own copy regardless). */
export const logoutSession = (refreshToken) =>
  apiRequest('/auth/logout', { method: 'POST', body: { refreshToken }, authenticated: false });
