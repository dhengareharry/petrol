import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  addPoints as storeAddPoints,
  addReferralBonus as storeAddReferralBonus,
  addVehicle as storeAddVehicle,
  changePin as storeChangePin,
  createCustomer as storeCreateCustomer,
  getAllCustomers,
  getCustomer as storeGetCustomer,
  removeVehicle as storeRemoveVehicle,
  updateProfileName as storeUpdateProfileName,
  updateVehicle as storeUpdateVehicle,
} from '../storage/customerStore';
import {
  approveClaim as storeApproveClaim,
  createClaim as storeCreateClaim,
  getAllClaims,
  rejectClaim as storeRejectClaim,
} from '../storage/fuelClaimStore';
import {
  createStaff as storeCreateStaff,
  getAllStaff,
  changeOwnPassword as storeChangeOwnPassword,
  setStaffActive as storeSetStaffActive,
  updateStaff as storeUpdateStaff,
} from '../storage/staffStore';
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
  const [claims, setClaims] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [customerList, requestList, claimList, staff] = await Promise.all([
      getAllCustomers(),
      getAllRequests(),
      getAllClaims(),
      getAllStaff(),
    ]);
    setCustomers(customerList);
    setRequests(requestList);
    setClaims(claimList);
    setStaffList(staff);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const addCustomer = useCallback(
    async ({ name, phone, vehicleNumber, vehicleModel, pin, referredByPhone }) => {
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

      const created = await storeCreateCustomer({ name, phone, vehicleNumber, vehicleModel, pin });
      if (referral) {
        await storeAddReferralBonus(referral, created.name);
      }
      await refresh();
      return created;
    },
    [refresh]
  );

  const creditPoints = useCallback(
    async (phone, litres, by) => {
      const updated = await storeAddPoints(phone, litres, by);
      await refresh();
      return updated;
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
    async (id, by) => {
      await storeApproveRequest(id, by);
      await refresh();
    },
    [refresh]
  );

  const rejectRequest = useCallback(
    async (id, by) => {
      await storeRejectRequest(id, by);
      await refresh();
    },
    [refresh]
  );

  const submitFuelClaim = useCallback(
    async (claim) => {
      await storeCreateClaim(claim);
      await refresh();
    },
    [refresh]
  );

  const approveFuelClaim = useCallback(
    async (id, amountRupees, by) => {
      await storeApproveClaim(id, amountRupees, by);
      await refresh();
    },
    [refresh]
  );

  const rejectFuelClaim = useCallback(
    async (id, by) => {
      await storeRejectClaim(id, by);
      await refresh();
    },
    [refresh]
  );

  const updateProfileName = useCallback(
    async (phone, name) => {
      await storeUpdateProfileName(phone, name);
      await refresh();
    },
    [refresh]
  );

  const changePin = useCallback(
    async (phone, currentPin, newPin) => {
      await storeChangePin(phone, currentPin, newPin);
      await refresh();
    },
    [refresh]
  );

  const addVehicle = useCallback(
    async (phone, vehicle) => {
      const updated = await storeAddVehicle(phone, vehicle);
      await refresh();
      return updated;
    },
    [refresh]
  );

  const updateVehicle = useCallback(
    async (phone, vehicleId, vehicle) => {
      await storeUpdateVehicle(phone, vehicleId, vehicle);
      await refresh();
    },
    [refresh]
  );

  const removeVehicle = useCallback(
    async (phone, vehicleId) => {
      await storeRemoveVehicle(phone, vehicleId);
      await refresh();
    },
    [refresh]
  );

  const createStaff = useCallback(
    async (account) => {
      await storeCreateStaff(account);
      await refresh();
    },
    [refresh]
  );

  const updateStaff = useCallback(
    async (id, changes) => {
      await storeUpdateStaff(id, changes);
      await refresh();
    },
    [refresh]
  );

  const changeOwnPassword = useCallback(
    async (id, currentPassword, newPassword) => {
      await storeChangeOwnPassword(id, currentPassword, newPassword);
      await refresh();
    },
    [refresh]
  );

  const setStaffActive = useCallback(
    async (id, active, actingStaffId) => {
      await storeSetStaffActive(id, active, actingStaffId);
      await refresh();
    },
    [refresh]
  );

  const getCustomerByPhone = useCallback((phone) => customers.find((c) => c.phone === phone) || null, [customers]);

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
      refresh,
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
      staffList,
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
      refresh,
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
      staffList,
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
