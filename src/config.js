// Where the backend API lives. Set EXPO_PUBLIC_API_URL in .env.local (see .env.example).
// A phone cannot reach "localhost" on your PC, so on a real device use the PC's address, e.g. http://192.168.1.5:4000/api/v1.
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace(/\/+$/, '');
