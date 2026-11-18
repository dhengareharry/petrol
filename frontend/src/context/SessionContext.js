import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest, apiRequestAll } from '../api/client';
import { toClaim, toCustomer, toHistoryEntry, toRequest, toStaff } from '../api/mappers';
import { useAuth } from './AuthContext';

const SessionContext = createContext(null);

// Staff don't trigger the changes that matter to them (customers' uploads and requests), so poll for them. The poll only
// reads the small "pending" queues, never whole customer/request lists.
const POLL_MS = 20000;
const PAGE_SIZE = 20;

const vehicleBody = ({ model, number }) => ({ number, model: model || undefined });
const query = (params) => new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')).toString();
const idList = (items) => items.map((i) => i.id).join(',');

// All data lives in the backend database. A customer sees only their own account; a cashier/admin sees the pending queues
// and pages through customers, claims and requests on demand (screens use usePagedList with the fetchers below).
export function SessionProvider({ children }) {
  const { role, customerPhone } = useAuth();
  // Customer: [their account]. Staff: unused (see staffCustomers).
  const [customers, setCustomers] = useState([]);
  // Customer: all their own. Staff: only those awaiting review.
  const [requests, setRequests] = useState([]);
  const [claims, setClaims] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [stats, setStats] = useState(null);
  // Staff: customers seen so far (any page), by phone, plus the ledgers of the ones opened.
  const [staffCustomers, setStaffCustomers] = useState({});
  const [historyByPhone, setHistoryByPhone] = useState({});
  // Bumped whenever staff data changes, so paged lists on screen reload.
  const [dataVersion, setDataVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  // The latest refresh failed (no connection, or the server is down): screens show a banner and keep the last data.
  const [syncError, setSyncError] = useState(false);
  const roleRef = useRef(role);
  roleRef.current = role;
  // Read through a ref so actions stay stable as the cache fills (a changing identity would re-trigger effects that call them).
  const staffCustomersRef = useRef(staffCustomers);
  staffCustomersRef.current = staffCustomers;
  const pendingSignature = useRef('');

  const loadCustomerData = useCallback(async () => {
    const [me, history, myRequests, myClaims] = await Promise.all([
      apiRequest('/me'),
      apiRequest(`/me/history?${query({ page: 1, pageSize: PAGE_SIZE })}`),
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
    const [requestList, claimList, staff, dashboard] = await Promise.all([
      apiRequestAll('/redemption-requests', { status: 'PENDING' }),
      apiRequestAll('/fuel-claims', { status: 'PENDING' }),
      isAdmin ? apiRequest('/staff') : Promise.resolve([]),
      isAdmin ? apiRequest('/reports/dashboard') : Promise.resolve(null),
    ]);
    return {
      requests: requestList.map((r) => toRequest(r)),
      claims: claimList.map((c) => toClaim(c)),
      staffList: staff.map(toStaff),
      stats: dashboard,
    };
  }, []);

  const refresh = useCallback(async () => {
    const current = roleRef.current;
    if (!current) return;
    const data = current === 'customer' ? await loadCustomerData() : await loadStaffData(current === 'admin');
    if (roleRef.current !== current) return; // signed out (or switched user) while loading
    if (current === 'customer') {
      setCustomers(data.customers);
    } else {
      // Anything new in the queues (or a change from another device) makes on-screen lists reload.
      const signature = `${idList(data.requests)}|${idList(data.claims)}`;
      if (signature !== pendingSignature.current) {
        pendingSignature.current = signature;
        setDataVersion((v) => v + 1);
      }
      setStaffList(data.staffList);
      setStats(data.stats);
    }
    setRequests(data.requests);
    setClaims(data.claims);
  }, [loadCustomerData, loadStaffData]);

  // Load on sign-in; wipe everything on sign-out so the next user never sees the previous user's data.
  useEffect(() => {
    if (!role) {
      setCustomers([]);
      setRequests([]);
      setClaims([]);
      setStaffList([]);
      setStats(null);
      setStaffCustomers({});
      setHistoryByPhone({});
      pendingSignature.current = '';
      setLoading(false);
      setSyncError(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    refresh()
      .then(() => !cancelled && setSyncError(false))
      .catch(() => !cancelled && setSyncError(true)) // the screens keep what they have and show a banner; the next poll retries
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role, customerPhone, refresh]);

  useEffect(() => {
    if (!role) return undefined;
    const timer = setInterval(() => refresh().then(() => setSyncError(false)).catch(() => setSyncError(true)), POLL_MS);
    return () => clearInterval(timer);
  }, [role, refresh]);

  // Runs a change, then re-reads what the screens show so they reflect what the server now holds.
  const mutate = useCallback(
    async (action) => {
      const result = await action();
      setDataVersion((v) => v + 1);
      await refresh().catch(() => undefined);
      return result;
    },
    [refresh]
  );

  const rememberCustomers = useCallback((items) => {
    setStaffCustomers((prev) => {
      const next = { ...prev };
      for (const item of items) next[item.phone] = { ...prev[item.phone], ...item };
      return next;
    });
  }, []);

  // ---- staff: paged data for screens (use with usePagedList) ----
  const fetchCustomerPage = useCallback(
    async ({ search, page }) => {
      const { data, meta } = await apiRequest(`/customers?${query({ search: search?.trim(), page, pageSize: PAGE_SIZE })}`, { withMeta: true });
      const items = data.map(toCustomer);
      rememberCustomers(items);
      return { items, hasMore: page < meta.totalPages };
    },
    [rememberCustomers]
  );

  // Admin: vehicles with no fuel fill for a while (the server decides how long: 30 days). Each row also carries `id` for paging.
  const fetchInactiveVehiclePage = useCallback(async (page) => {
    const { data, meta } = await apiRequest(`/reports/inactive-vehicles?${query({ page, pageSize: PAGE_SIZE })}`, { withMeta: true });
    return { items: data.map((row) => ({ ...row, id: row.vehicle.id })), hasMore: page < meta.totalPages };
  }, []);

  const fetchClaimPage = useCallback(async (page) => {
    const { data, meta } = await apiRequest(`/fuel-claims?${query({ page, pageSize: PAGE_SIZE })}`, { withMeta: true });
    return { items: data.map((c) => toClaim(c)), hasMore: page < meta.totalPages };
  }, []);

  const fetchRequestPage = useCallback(async (page) => {
    const { data, meta } = await apiRequest(`/redemption-requests?${query({ page, pageSize: PAGE_SIZE })}`, { withMeta: true });
    return { items: data.map((r) => toRequest(r)), hasMore: page < meta.totalPages };
  }, []);

  // Opens a customer's page: fresh profile numbers plus their most recent ledger entries.
  const openCustomer = useCallback(
    async (phone) => {
      const known = staffCustomersRef.current[phone];
      if (!known) throw new Error('Customer not found.');
      const [profile, history] = await Promise.all([
        apiRequest(`/customers/${known.id}`),
        apiRequest(`/customers/${known.id}/history?${query({ page: 1, pageSize: 100 })}`),
      ]);
      rememberCustomers([toCustomer(profile)]);
      setHistoryByPhone((prev) => ({ ...prev, [phone]: history.map(toHistoryEntry) }));
    },
    [rememberCustomers]
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
        const customer = toCustomer(created);
        rememberCustomers([customer]);
        return customer;
      }),
    [mutate, rememberCustomers]
  );

  // The signed-in customer deletes their own account (the server asks for the PIN again). Signing out afterwards is up to the caller.
  const deleteAccount = useCallback((pin) => apiRequest('/me', { method: 'DELETE', body: { pin } }), []);

  // A cashier/admin sets a new PIN for a customer who forgot theirs (there is no SMS reset while SMS verification is off).
  const resetCustomerPin = useCallback(async (phone, newPin) => {
    const known = staffCustomersRef.current[phone];
    if (!known) throw new Error('Customer not found.');
    await apiRequest(`/customers/${known.id}/reset-pin`, { method: 'POST', body: { newPin } });
  }, []);

  // The cashier records a fill-up for a customer, together with the proof they captured: the vehicle, the dashboard photo
  // and where it was taken. Resolves to the customer's updated account.
  const creditPoints = useCallback(
    (phone, { amountRupees, proof }) =>
      mutate(async () => {
        const known = staffCustomersRef.current[phone];
        if (!known) throw new Error('Customer not found.');
        const result = await apiRequest('/fuel-entries', {
          method: 'POST',
          timeoutMs: 60000, // the photo is a few hundred KB; allow for slow mobile data
          body: {
            customerId: known.id,
            amountRupees,
            ...(proof
              ? {
                  proof: {
                    ...(proof.vehicleId ? { vehicleId: proof.vehicleId } : { vehicleNumber: proof.vehicleNumber }),
                    latitude: proof.location.latitude,
                    longitude: proof.location.longitude,
                    ...(proof.location.accuracy != null ? { accuracy: proof.location.accuracy } : {}),
                    photoDataUri: proof.photoDataUri,
                  },
                }
              : {}),
          },
        });
        const updated = toCustomer(result.customer);
        rememberCustomers([updated]);
        return updated;
      }),
    [mutate, rememberCustomers]
  );

  // ---- redemption requests ----
  const requestRedemption = useCallback(
    (_phone, reward) =>
      mutate(() => apiRequest('/redemption-requests', { method: 'POST', body: { rewardId: reward.id } })),
    [mutate]
  );

  // Staff hand the gift over to the customer: the photo (and where it was taken) goes with it. The server stamps the photo.
  const issueRedemption = useCallback(
    (id, proof) =>
      mutate(() =>
        apiRequest(`/redemption-requests/${id}/issue`, {
          method: 'POST',
          timeoutMs: 60000,
          body: {
            photoDataUri: proof.photoDataUri,
            latitude: proof.location.latitude,
            longitude: proof.location.longitude,
            ...(proof.location.accuracy != null ? { accuracy: proof.location.accuracy } : {}),
          },
        })
      ),
    [mutate]
  );

  // Staff cancel a request; the points go back to the customer. `reason` is shown to the customer.
  const rejectRequest = useCallback(
    (id, reason) =>
      mutate(() => apiRequest(`/redemption-requests/${id}/reject`, { method: 'POST', body: reason ? { reason } : {} })),
    [mutate]
  );

  // The customer withdraws their own pending request; the points come back.
  const cancelRedemption = useCallback(
    (id) => mutate(() => apiRequest(`/redemption-requests/${id}/cancel`, { method: 'POST' })),
    [mutate]
  );

  // ---- fuel proofs (staff review the ones submitted before cashiers started capturing them) ----
  const approveFuelClaim = useCallback(
    (id, amountRupees) =>
      mutate(() => apiRequest(`/fuel-claims/${id}/approve`, { method: 'POST', body: { amountRupees: Number(amountRupees) } })),
    [mutate]
  );

  // `reason` is shown to the customer next to the rejected upload.
  const rejectFuelClaim = useCallback(
    (id, reason) =>
      mutate(() => apiRequest(`/fuel-claims/${id}/reject`, { method: 'POST', body: reason ? { reason } : {} })),
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

  const getCustomerByPhone = useCallback(
    (phone) => {
      if (role === 'customer') return customers.find((c) => c.phone === phone) || null;
      const known = staffCustomers[phone];
      return known ? { ...known, history: historyByPhone[phone] || [] } : null;
    },
    [role, customers, staffCustomers, historyByPhone]
  );

  const pendingRequests = useMemo(() => requests.filter((r) => r.status === 'pending'), [requests]);
  const pendingClaims = useMemo(() => claims.filter((c) => c.status === 'pending'), [claims]);

  const value = useMemo(
    () => ({
      loading,
      customers,
      requests,
      pendingRequests,
      claims,
      pendingClaims,
      staffList,
      stats,
      syncError,
      dataVersion,
      refresh,
      fetchCustomerPage,
      fetchInactiveVehiclePage,
      fetchClaimPage,
      fetchRequestPage,
      openCustomer,
      addCustomer,
      resetCustomerPin,
      deleteAccount,
      creditPoints,
      requestRedemption,
      issueRedemption,
      rejectRequest,
      cancelRedemption,
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
      customers,
      requests,
      pendingRequests,
      claims,
      pendingClaims,
      staffList,
      stats,
      syncError,
      dataVersion,
      refresh,
      fetchCustomerPage,
      fetchInactiveVehiclePage,
      fetchClaimPage,
      fetchRequestPage,
      openCustomer,
      addCustomer,
      resetCustomerPin,
      deleteAccount,
      creditPoints,
      requestRedemption,
      issueRedemption,
      rejectRequest,
      cancelRedemption,
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
