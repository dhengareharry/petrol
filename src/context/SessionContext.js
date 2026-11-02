import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest, apiRequestAll } from '../api/client';
import { toClaim, toCustomer, toHistoryEntry, toRequest, toStaff } from '../api/mappers';
import { useAuth } from './AuthContext';

const SessionContext = createContext(null);

// Staff don't trigger the changes that matter to them (customers' uploads and requests), so poll for them.
const POLL_MS = 20000;

const vehicleBody = ({ model, number }) => ({ number, model: model || undefined });

// All data lives in the backend database. This context loads what the signed-in user may see — a customer sees only
// their own account, a cashier/admin sees everyone — and exposes the same actions the screens always used.
export function SessionProvider({ children }) {
  const { role, customerPhone } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [claims, setClaims] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [historyByPhone, setHistoryByPhone] = useState({});
  const [loading, setLoading] = useState(false);
  const roleRef = useRef(role);
  roleRef.current = role;

  const loadCustomerData = useCallback(async () => {
    const [me, history, myRequests, myClaims] = await Promise.all([
      apiRequest('/me'),
      apiRequestAll('/me/history'),
      apiRequest('/redemption-requests/mine'),
      apiRequest('/fuel-claims/mine'),
    ]);
    const customer = { ...toCustomer(me), history: history.map(toHistoryEntry) };
    return {
      customers: [customer],
      requests: myRequests.map((r) => toRequest(r, customer)),
      claims: myClaims.map((c) => toClaim(c, customer)),
    };
  }, []);

  const loadStaffData = useCallback(async (isAdmin) => {
    const [customerList, requestList, claimList, staff, dashboard] = await Promise.all([
      apiRequestAll('/customers'),
      apiRequestAll('/redemption-requests'),
      apiRequestAll('/fuel-claims'),
      isAdmin ? apiRequest('/staff') : Promise.resolve([]),
      isAdmin ? apiRequest('/reports/dashboard') : Promise.resolve(null),
    ]);
    return {
      customers: customerList.map(toCustomer),
      requests: requestList.map((r) => toRequest(r)),
      claims: claimList.map((c) => toClaim(c)),
      staffList: staff.map(toStaff),
      redeemedPoints: dashboard?.pointsRedeemed ?? 0,
    };
  }, []);

  const refresh = useCallback(async () => {
    const current = roleRef.current;
    if (!current) return;
    const data = current === 'customer' ? await loadCustomerData() : await loadStaffData(current === 'admin');
    if (roleRef.current !== current) return; // signed out (or switched user) while loading
    setCustomers(data.customers);
    setRequests(data.requests);
    setClaims(data.claims);
    setStaffList(data.staffList ?? []);
    setRedeemedPoints(data.redeemedPoints ?? 0);
  }, [loadCustomerData, loadStaffData]);

  // Load on sign-in; wipe everything on sign-out so the next user never sees the previous user's data.
  useEffect(() => {
    if (!role) {
      setCustomers([]);
      setRequests([]);
      setClaims([]);
      setStaffList([]);
      setRedeemedPoints(0);
      setHistoryByPhone({});
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    refresh()
      .catch(() => undefined) // the screens show an empty state; the next poll or action retries
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role, customerPhone, refresh]);

  useEffect(() => {
    if (!role) return undefined;
    const timer = setInterval(() => refresh().catch(() => undefined), POLL_MS);
    return () => clearInterval(timer);
  }, [role, refresh]);

  const customerIdFor = useCallback(
    (phone) => {
      const match = customers.find((c) => c.phone === phone);
      if (!match) throw new Error('Customer not found.');
      return match.id;
    },
    [customers]
  );

  // Runs a change, then re-reads the data so every screen reflects what the server now holds.
  const mutate = useCallback(
    async (action) => {
      const result = await action();
      await refresh().catch(() => undefined);
      return result;
    },
    [refresh]
  );

  // Staff open a customer's ledger on demand (it's a separate, paged endpoint).
  const loadHistory = useCallback(
    async (phone) => {
      const entries = await apiRequestAll(`/customers/${customerIdFor(phone)}/history`);
      setHistoryByPhone((prev) => ({ ...prev, [phone]: entries.map(toHistoryEntry) }));
    },
    [customerIdFor]
  );

  // ---- staff: customers and fuel ----
  const addCustomer = useCallback(
    ({ name, phone, vehicleNumber, vehicleModel, pin, referredByPhone }) =>
      mutate(async () => {
        const created = await apiRequest('/customers', {
          method: 'POST',
          body: {
            name,
            phone,
            ...(pin ? { pin } : {}),
            ...(vehicleNumber || vehicleModel ? { vehicle: vehicleBody({ model: vehicleModel, number: vehicleNumber }) } : {}),
            ...(referredByPhone ? { referralCode: referredByPhone } : {}),
          },
        });
        return toCustomer(created);
      }),
    [mutate]
  );

  // Records a fill-up (in litres) for the customer; resolves to their updated account.
  const creditPoints = useCallback(
    (phone, litres) =>
      mutate(async () => {
        const result = await apiRequest('/fuel-entries', {
          method: 'POST',
          body: { customerId: customerIdFor(phone), litres },
        });
        return toCustomer(result.customer);
      }),
    [mutate, customerIdFor]
  );

  // ---- redemption requests ----
  const requestRedemption = useCallback(
    (_phone, reward) =>
      mutate(() => apiRequest('/redemption-requests', { method: 'POST', body: { rewardId: reward.id } })),
    [mutate]
  );

  const approveRequest = useCallback(
    (id) => mutate(() => apiRequest(`/redemption-requests/${id}/approve`, { method: 'POST' })),
    [mutate]
  );

  const rejectRequest = useCallback(
    (id) => mutate(() => apiRequest(`/redemption-requests/${id}/reject`, { method: 'POST' })),
    [mutate]
  );

  // ---- fuel proofs ----
  const submitFuelClaim = useCallback(
    ({ vehicleId, amountRupees, photoDataUri, location }) =>
      mutate(() =>
        apiRequest('/fuel-claims', {
          method: 'POST',
          timeoutMs: 60000, // the photo is a few hundred KB; allow for slow mobile data
          body: {
            vehicleId,
            amountRupees,
            latitude: location.latitude,
            longitude: location.longitude,
            ...(location.accuracy != null ? { accuracy: location.accuracy } : {}),
            photoDataUri,
          },
        })
      ),
    [mutate]
  );

  const approveFuelClaim = useCallback(
    (id, amountRupees) =>
      mutate(() => apiRequest(`/fuel-claims/${id}/approve`, { method: 'POST', body: { amountRupees: Number(amountRupees) } })),
    [mutate]
  );

  const rejectFuelClaim = useCallback(
    (id) => mutate(() => apiRequest(`/fuel-claims/${id}/reject`, { method: 'POST', body: {} })),
    [mutate]
  );

  // ---- the signed-in customer's own profile ----
  const updateProfileName = useCallback(
    (_phone, name) => mutate(() => apiRequest('/me', { method: 'PATCH', body: { name } })),
    [mutate]
  );

  const changePin = useCallback(
    (_phone, currentPin, newPin) => mutate(() => apiRequest('/me/pin', { method: 'PATCH', body: { currentPin, newPin } })),
    [mutate]
  );

  // Resolves to the customer's updated account, so the caller can pick the vehicle that was just added.
  const addVehicle = useCallback(
    (_phone, vehicle) =>
      mutate(async () => {
        await apiRequest('/me/vehicles', { method: 'POST', body: vehicleBody(vehicle) });
        return toCustomer(await apiRequest('/me'));
      }),
    [mutate]
  );

  const updateVehicle = useCallback(
    (_phone, vehicleId, vehicle) =>
      mutate(() => apiRequest(`/me/vehicles/${vehicleId}`, { method: 'PATCH', body: vehicleBody(vehicle) })),
    [mutate]
  );

  const removeVehicle = useCallback(
    (_phone, vehicleId) => mutate(() => apiRequest(`/me/vehicles/${vehicleId}`, { method: 'DELETE' })),
    [mutate]
  );

  // ---- staff accounts (admin) ----
  const createStaff = useCallback(
    ({ name, username, password, role: staffRole }) =>
      mutate(() =>
        apiRequest('/staff', { method: 'POST', body: { name, username, password, role: String(staffRole).toUpperCase() } })
      ),
    [mutate]
  );

  const updateStaff = useCallback(
    (id, { name, username, password }) =>
      mutate(() => apiRequest(`/staff/${id}`, { method: 'PATCH', body: { name, username, ...(password ? { password } : {}) } })),
    [mutate]
  );

  const changeOwnPassword = useCallback(
    (_id, currentPassword, newPassword) =>
      mutate(() => apiRequest('/staff/me/password', { method: 'PATCH', body: { currentPassword, newPassword } })),
    [mutate]
  );

  const setStaffActive = useCallback(
    (id, active) => mutate(() => apiRequest(`/staff/${id}/active`, { method: 'PATCH', body: { active } })),
    [mutate]
  );

  // Staff ledgers are loaded on demand and merged in here.
  const customersWithHistory = useMemo(
    () => customers.map((c) => (historyByPhone[c.phone] && !c.history.length ? { ...c, history: historyByPhone[c.phone] } : c)),
    [customers, historyByPhone]
  );

  const getCustomerByPhone = useCallback(
    (phone) => customersWithHistory.find((c) => c.phone === phone) || null,
    [customersWithHistory]
  );

  const pendingRequests = useMemo(() => requests.filter((r) => r.status === 'pending'), [requests]);
  const pendingClaims = useMemo(() => claims.filter((c) => c.status === 'pending'), [claims]);

  const value = useMemo(
    () => ({
      loading,
      customers: customersWithHistory,
      requests,
      pendingRequests,
      claims,
      pendingClaims,
      staffList,
      redeemedPoints,
      refresh,
      loadHistory,
      addCustomer,
      creditPoints,
      requestRedemption,
      approveRequest,
      rejectRequest,
      submitFuelClaim,
      approveFuelClaim,
      rejectFuelClaim,
      updateProfileName,
      changePin,
      addVehicle,
      updateVehicle,
      removeVehicle,
      createStaff,
      updateStaff,
      changeOwnPassword,
      setStaffActive,
      getCustomerByPhone,
    }),
    [
      loading,
      customersWithHistory,
      requests,
      pendingRequests,
      claims,
      pendingClaims,
      staffList,
      redeemedPoints,
      refresh,
      loadHistory,
      addCustomer,
      creditPoints,
      requestRedemption,
      approveRequest,
      rejectRequest,
      submitFuelClaim,
      approveFuelClaim,
      rejectFuelClaim,
      updateProfileName,
      changePin,
      addVehicle,
      updateVehicle,
      removeVehicle,
      createStaff,
      updateStaff,
      changeOwnPassword,
      setStaffActive,
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
