import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { verifyCustomerLogin } from '../storage/customerStore';
import { getStaffById, verifyStaffLogin } from '../storage/staffStore';
import { clearSession, getSession, saveSession } from '../storage/authStore';

const AuthContext = createContext(null);

// Session shapes: { role: 'customer', phone } or { role: 'staff', staffId }.
export function AuthProvider({ children }) {
  const [customerPhone, setCustomerPhone] = useState(null);
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      const session = await getSession();
      if (session?.role === 'customer' && session.phone) {
        setCustomerPhone(session.phone);
      } else if (session?.role === 'staff' && session.staffId) {
        const account = await getStaffById(session.staffId);
        if (account?.active) {
          setStaff({ id: account.id, name: account.name, role: account.role });
        } else {
          await clearSession();
        }
      } else if (session) {
        await clearSession();
      }
    }
    restore().finally(() => setLoading(false));
  }, []);

  const loginAsStaff = useCallback(async (username, password) => {
    const account = await verifyStaffLogin(username, password);
    await saveSession({ role: 'staff', staffId: account.id });
    setCustomerPhone(null);
    setStaff({ id: account.id, name: account.name, role: account.role });
  }, []);

  const loginAsCustomer = useCallback(async (phone, pin) => {
    const customer = await verifyCustomerLogin(phone.trim(), pin.trim());
    await saveSession({ role: 'customer', phone: customer.phone });
    setStaff(null);
    setCustomerPhone(customer.phone);
    return customer;
  }, []);

  // Called after a new customer record has already been created elsewhere
  // (SessionContext.addCustomer), to log the app into that new account.
  const loginCustomerSession = useCallback(async (phone) => {
    await saveSession({ role: 'customer', phone });
    setStaff(null);
    setCustomerPhone(phone);
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
    setCustomerPhone(null);
    setStaff(null);
  }, []);

  const role = customerPhone ? 'customer' : staff ? staff.role : null;

  const value = useMemo(
    () => ({ loading, role, customerPhone, staff, loginAsStaff, loginAsCustomer, loginCustomerSession, logout }),
    [loading, role, customerPhone, staff, loginAsStaff, loginAsCustomer, loginCustomerSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
