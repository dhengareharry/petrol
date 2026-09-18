// Demo-only credentials. There is no backend here, so this is a local gate
// for the client demo, not real authentication.
export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

export function verifyAdminLogin(username, password) {
  return username.trim() === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password;
}

export const DEFAULT_CUSTOMER_PIN = '1234';
