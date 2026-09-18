import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { verifyAdminLogin } from '../auth';
import { verifyCustomerLogin } from '../storage/customerStore';
import { clearSession, getSession, saveSession } from '../storage/authStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null);
  const [customerPhone, setCustomerPhone] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession()
      .then((session) => {
        if (session?.role === 'admin') {
          setRole('admin');
        } else if (session?.role === 'customer' && session.phone) {
          setRole('customer');
          setCustomerPhone(session.phone);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const loginAsAdmin = useCallback(async (username, password) => {
    if (!verifyAdminLogin(username, password)) {
      throw new Error('Incorrect username or password.');
    }
    await saveSession({ role: 'admin' });
    setRole('admin');
    setCustomerPhone(null);
  }, []);

  const loginAsCustomer = useCallback(async (phone, pin) => {
    const customer = await verifyCustomerLogin(phone.trim(), pin.trim());
    await saveSession({ role: 'customer', phone: customer.phone });
    setRole('customer');
    setCustomerPhone(customer.phone);
    return customer;
  }, []);

  // Called after a new customer record has already been created elsewhere
  // (SessionContext.addCustomer), to log the app into that new account.
  const loginCustomerSession = useCallback(async (phone) => {
    await saveSession({ role: 'customer', phone });
    setRole('customer');
    setCustomerPhone(phone);
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
    setRole(null);
    setCustomerPhone(null);
  }, []);

  const value = useMemo(
    () => ({ loading, role, customerPhone, loginAsAdmin, loginAsCustomer, loginCustomerSession, logout }),
    [loading, role, customerPhone, loginAsAdmin, loginAsCustomer, loginCustomerSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
