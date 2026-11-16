import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMe, loginCustomer, loginStaff, logoutSession, registerCustomer } from '../api/auth';
import { setSession, setSessionHandlers } from '../api/client';
import { toStaff } from '../api/mappers';
import { clearSession, getSession, saveSession } from '../storage/authStore';

const AuthContext = createContext(null);

// Signed in as either a customer (identified by phone) or a staff member (cashier/admin). The server decides which
// from the token; the app only keeps the tokens and asks /auth/me who they belong to. The access token is short-lived and
// renewed silently (see api/client.js), so a user stays signed in as long as they open the app within 30 days.
export function AuthProvider({ children }) {
  const [customerPhone, setCustomerPhone] = useState(null);
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  // The saved sign-in could not be checked because the server was unreachable (as opposed to being rejected).
  const [connectionError, setConnectionError] = useState(false);

  const endLocally = useCallback(async () => {
    setSession(null);
    await clearSession();
    setCustomerPhone(null);
    setStaff(null);
  }, []);

  useEffect(() => {
    // Renewed tokens are saved straight away; a refresh token the server rejected means the session is over.
    setSessionHandlers({ changed: saveSession, unauthorized: () => void endLocally() });
    return () => setSessionHandlers({});
  }, [endLocally]);

  const restore = useCallback(async () => {
    setConnectionError(false);
    const saved = await getSession();
    if (!saved) return;
    setSession(saved);
    try {
      const me = await fetchMe(); // renews the tokens first if the saved access token has expired
      if (me.role === 'CUSTOMER') setCustomerPhone(me.customer.phone);
      else setStaff(toStaff(me.staff));
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        await endLocally(); // the server rejected the session: it is over
      } else {
        // Merely unreachable (or a server hiccup): keep the saved sign-in and let the user retry from a clear screen.
        setSession(null);
        setConnectionError(true);
      }
    }
  }, [endLocally]);

  useEffect(() => {
    restore().finally(() => setLoading(false));
  }, [restore]);

  const retryRestore = useCallback(async () => {
    await restore();
  }, [restore]);

  const startSession = useCallback(async ({ token, refreshToken }) => {
    setSession({ token, refreshToken });
    await saveSession({ token, refreshToken });
  }, []);

  const loginAsStaff = useCallback(
    async (username, password) => {
      const result = await loginStaff(username.trim(), password);
      await startSession(result);
      setCustomerPhone(null);
      setStaff(toStaff(result.staff));
    },
    [startSession]
  );

  const loginAsCustomer = useCallback(
    async (phone, pin) => {
      const result = await loginCustomer(phone.trim(), pin.trim());
      await startSession(result);
      setStaff(null);
      setCustomerPhone(result.customer.phone);
    },
    [startSession]
  );

  // One sign-in for everyone: a 10-digit phone number is a customer (PIN); anything else is a staff username (password).
  const login = useCallback(
    (identifier, secret) =>
      /^\d{10}$/.test(identifier.trim()) ? loginAsCustomer(identifier, secret) : loginAsStaff(identifier, secret),
    [loginAsCustomer, loginAsStaff]
  );

  // Creates the account in the database (the phone number must already be proven with an SMS code) and signs in.
  const registerAsCustomer = useCallback(
    async (details) => {
      const result = await registerCustomer(details);
      await startSession(result);
      setStaff(null);
      setCustomerPhone(result.customer.phone);
    },
    [startSession]
  );

  const logout = useCallback(async () => {
    const saved = await getSession();
    if (saved?.refreshToken) await logoutSession(saved.refreshToken).catch(() => undefined); // best effort: also ends it on the server
    await endLocally();
  }, [endLocally]);

  const role = customerPhone ? 'customer' : staff ? staff.role : null;

  const value = useMemo(
    () => ({ loading, connectionError, retryRestore, role, customerPhone, staff, login, loginAsStaff, loginAsCustomer, registerAsCustomer, logout }),
    [loading, connectionError, retryRestore, role, customerPhone, staff, login, loginAsStaff, loginAsCustomer, registerAsCustomer, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
