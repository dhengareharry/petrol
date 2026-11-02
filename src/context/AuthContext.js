import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMe, loginCustomer, loginStaff, registerCustomer } from '../api/auth';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';
import { toStaff } from '../api/mappers';
import { clearToken, getToken, saveToken } from '../storage/authStore';

const AuthContext = createContext(null);

// Signed in as either a customer (identified by phone) or a staff member (cashier/admin). The server decides which
// from the token; the app only keeps the token and asks /auth/me who it belongs to.
export function AuthProvider({ children }) {
  const [customerPhone, setCustomerPhone] = useState(null);
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  const signOutLocally = useCallback(async () => {
    setAuthToken(null);
    await clearToken();
    setCustomerPhone(null);
    setStaff(null);
  }, []);

  useEffect(() => {
    async function restore() {
      const token = await getToken();
      if (!token) return;
      setAuthToken(token);
      try {
        const me = await fetchMe();
        if (me.role === 'CUSTOMER') setCustomerPhone(me.customer.phone);
        else setStaff(toStaff(me.staff));
      } catch (error) {
        // An expired/revoked token is discarded. If the server is merely unreachable, keep the token for next time.
        if (error.status === 401 || error.status === 403) await signOutLocally();
        else setAuthToken(null);
      }
    }
    restore().finally(() => setLoading(false));
  }, [signOutLocally]);

  // A 401 on any later request means the session ended (token expired, or staff access was withdrawn).
  useEffect(() => {
    setUnauthorizedHandler(() => void signOutLocally());
    return () => setUnauthorizedHandler(null);
  }, [signOutLocally]);

  const startCustomerSession = useCallback(async ({ token, customer }) => {
    await saveToken(token);
    setAuthToken(token);
    setStaff(null);
    setCustomerPhone(customer.phone);
  }, []);

  const loginAsStaff = useCallback(async (username, password) => {
    const result = await loginStaff(username.trim(), password);
    await saveToken(result.token);
    setAuthToken(result.token);
    setCustomerPhone(null);
    setStaff(toStaff(result.staff));
  }, []);

  const loginAsCustomer = useCallback(
    async (phone, pin) => startCustomerSession(await loginCustomer(phone.trim(), pin.trim())),
    [startCustomerSession]
  );

  // Creates the account in the database (the phone number must already be proven with an SMS code) and signs in.
  const registerAsCustomer = useCallback(
    async (details) => startCustomerSession(await registerCustomer(details)),
    [startCustomerSession]
  );

  const role = customerPhone ? 'customer' : staff ? staff.role : null;

  const value = useMemo(
    () => ({
      loading,
      role,
      customerPhone,
      staff,
      loginAsStaff,
      loginAsCustomer,
      registerAsCustomer,
      logout: signOutLocally,
    }),
    [loading, role, customerPhone, staff, loginAsStaff, loginAsCustomer, registerAsCustomer, signOutLocally]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
