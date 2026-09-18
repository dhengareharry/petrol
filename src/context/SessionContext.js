import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  addPoints as storeAddPoints,
  addReferralBonus as storeAddReferralBonus,
  createCustomer as storeCreateCustomer,
  getAllCustomers,
  getCustomer as storeGetCustomer,
} from '../storage/customerStore';
import {
  approveRequest as storeApproveRequest,
  createRequest as storeCreateRequest,
  getAllRequests,
  rejectRequest as storeRejectRequest,
} from '../storage/requestStore';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [customers, setCustomers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [customerList, requestList] = await Promise.all([getAllCustomers(), getAllRequests()]);
    setCustomers(customerList);
    setRequests(requestList);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const addCustomer = useCallback(
    async ({ name, phone, vehicleNumber, pin, referredByPhone }) => {
      const referral = referredByPhone ? referredByPhone.trim() : '';
      if (referral) {
        if (referral === phone.trim()) {
          throw new Error('You cannot refer yourself.');
        }
        const referrer = await storeGetCustomer(referral);
        if (!referrer) {
          throw new Error('Referral code not found.');
        }
      }

      const created = await storeCreateCustomer({ name, phone, vehicleNumber, pin });
      if (referral) {
        await storeAddReferralBonus(referral, created.name);
      }
      await refresh();
      return created;
    },
    [refresh]
  );

  const creditPoints = useCallback(
    async (phone, litres) => {
      await storeAddPoints(phone, litres);
      await refresh();
    },
    [refresh]
  );

  const requestRedemption = useCallback(
    async (phone, reward) => {
      await storeCreateRequest(phone, reward);
      await refresh();
    },
    [refresh]
  );

  const approveRequest = useCallback(
    async (id) => {
      await storeApproveRequest(id);
      await refresh();
    },
    [refresh]
  );

  const rejectRequest = useCallback(
    async (id) => {
      await storeRejectRequest(id);
      await refresh();
    },
    [refresh]
  );

  const getCustomerByPhone = useCallback((phone) => customers.find((c) => c.phone === phone) || null, [customers]);

  const pendingRequests = useMemo(() => requests.filter((r) => r.status === 'pending'), [requests]);

  const value = useMemo(
    () => ({
      loading,
      customers,
      requests,
      pendingRequests,
      refresh,
      addCustomer,
      creditPoints,
      requestRedemption,
      approveRequest,
      rejectRequest,
      getCustomerByPhone,
    }),
    [
      loading,
      customers,
      requests,
      pendingRequests,
      refresh,
      addCustomer,
      creditPoints,
      requestRedemption,
      approveRequest,
      rejectRequest,
      getCustomerByPhone,
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
