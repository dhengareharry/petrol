import { useEffect, useState } from 'react';

import AppFrame from '../components/AppFrame';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import CustomerDetailScreen from '../screens/admin/CustomerDetailScreen';
import FuelClaimsScreen from '../screens/admin/FuelClaimsScreen';
import FuelFillingScreen from '../screens/admin/FuelFillingScreen';
import RedeemRequestsScreen from '../screens/admin/RedeemRequestsScreen';
import InactiveVehiclesScreen from '../screens/admin/InactiveVehiclesScreen';
import IssuedItemsScreen from '../screens/admin/IssuedItemsScreen';
import MyAccountScreen from '../screens/admin/MyAccountScreen';
import SettingsScreen from '../screens/admin/SettingsScreen';
import StaffScreen from '../screens/admin/StaffScreen';
import CustomersScreen from '../screens/CustomersScreen';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';

const ADMIN_TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'chart' },
  { key: 'customers', label: 'Customers', icon: 'users' },
  { key: 'fuelClaims', label: 'Fuel Proofs', icon: 'camera' },
  { key: 'requests', label: 'Requests', icon: 'inbox' },
  { key: 'staff', label: 'Staff', icon: 'wrench' },
];

const CASHIER_TABS = [
  { key: 'fuelEntry', label: 'Fuel Entry', icon: 'fuel' },
  { key: 'customers', label: 'Customers', icon: 'users' },
  { key: 'fuelClaims', label: 'Fuel Proofs', icon: 'camera' },
  { key: 'requests', label: 'Requests', icon: 'inbox' },
];

export default function AdminApp() {
  const { logout, role, staff: sessionStaff } = useAuth();
  const isAdmin = role === 'admin';
  const tabs = isAdmin ? ADMIN_TABS : CASHIER_TABS;

  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const [viewingPhone, setViewingPhone] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [issuedLogOpen, setIssuedLogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inactiveOpen, setInactiveOpen] = useState(false);
  const {
    requests,
    pendingRequests,
    claims,
    pendingClaims,
    staffList,
    stats,
    dataVersion,
    fetchCustomerPage,
    fetchInactiveVehiclePage,
    fetchClaimPage,
    fetchRequestPage,
    openCustomer,
    addCustomer,
    resetCustomerPin,
    creditPoints,
    issueRedemption,
    rejectRequest,
    approveFuelClaim,
    rejectFuelClaim,
    createStaff,
    updateStaff,
    changeOwnPassword,
    setStaffActive,
    getCustomerByPhone,
  } = useSession();

  // Prefer the stored account so name/username edits show up immediately.
  const staff = staffList.find((s) => s.id === sessionStaff.id) || sessionStaff;

  // Every action is stamped with the signed-in staff member's name.
  const by = staff.name;
  const credit = (phone, litres) => creditPoints(phone, litres, by);
  const approveClaim = (id, amount) => approveFuelClaim(id, amount, by);
  const rejectClaim = (id, reason) => rejectFuelClaim(id, reason);

  // Admin alert: vehicles that have not filled fuel for a while (the server counts them and sets the threshold, 30 days).
  const inactiveCount = isAdmin ? (stats?.inactiveVehicles ?? 0) : 0;
  const inactiveDays = stats?.inactiveVehicleDays ?? 30;

  const pendingSummary = [
    pendingRequests.length > 0 ? `${pendingRequests.length} redeem` : '',
    pendingClaims.length > 0 ? `${pendingClaims.length} fuel proof` : '',
    inactiveCount > 0 ? `${inactiveCount} inactive vehicle${inactiveCount === 1 ? '' : 's'}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const viewingCustomer = viewingPhone ? getCustomerByPhone(viewingPhone) : null;

  // A customer's page loads fresh numbers and their latest ledger when it opens, and again whenever their balance changes.
  const viewingPoints = viewingCustomer?.lifetimePoints;
  const viewingBalance = viewingCustomer?.points;
  useEffect(() => {
    if (viewingPhone) openCustomer(viewingPhone).catch(() => undefined);
  }, [viewingPhone, viewingPoints, viewingBalance, openCustomer]);

  function goToTab(key) {
    setViewingPhone(null);
    setAccountOpen(false);
    setIssuedLogOpen(false);
    setSettingsOpen(false);
    setInactiveOpen(false);
    setActiveTab(key);
  }

  // From an alert row: make sure the customer is loaded, then open their page.
  async function openCustomerFromAlert(phone) {
    try {
      await fetchCustomerPage({ search: phone, page: 1 });
    } catch {
      return;
    }
    goToTab('customers');
    setViewingPhone(phone);
  }

  function renderScreen() {
    if (accountOpen) {
      return <MyAccountScreen account={staff} onChangePassword={changeOwnPassword} onBack={() => setAccountOpen(false)} />;
    }

    if (isAdmin && issuedLogOpen) {
      return <IssuedItemsScreen onBack={() => setIssuedLogOpen(false)} />;
    }

    if (isAdmin && settingsOpen) {
      return <SettingsScreen onBack={() => setSettingsOpen(false)} />;
    }

    if (isAdmin && inactiveOpen) {
      return (
        <InactiveVehiclesScreen
          fetchPage={fetchInactiveVehiclePage}
          reloadKey={dataVersion}
          days={inactiveDays}
          onBack={() => setInactiveOpen(false)}
          onOpenCustomer={openCustomerFromAlert}
        />
      );
    }

    // Recording fuel is a cashier-only job; admins never get a way to enter it.
    if (!isAdmin && activeTab === 'fuelEntry') {
      return (
        <FuelFillingScreen
          fetchCustomers={fetchCustomerPage}
          reloadKey={dataVersion}
          onCreditPoints={credit}
          getCustomerByPhone={getCustomerByPhone}
        />
      );
    }

    if (activeTab === 'customers') {
      if (viewingCustomer) {
        return (
          <CustomerDetailScreen
            customer={viewingCustomer}
            onBack={() => setViewingPhone(null)}
            onCreditPoints={isAdmin ? undefined : credit}
            onResetPin={resetCustomerPin}
          />
        );
      }
      return (
        <CustomersScreen
          fetchCustomers={fetchCustomerPage}
          reloadKey={dataVersion}
          onSelect={setViewingPhone}
          onCreate={addCustomer}
        />
      );
    }

    if (activeTab === 'fuelClaims') {
      return (
        <FuelClaimsScreen
          claims={claims}
          fetchPage={fetchClaimPage}
          reloadKey={dataVersion}
          onApprove={approveClaim}
          onReject={rejectClaim}
        />
      );
    }

    if (activeTab === 'requests') {
      return (
        <RedeemRequestsScreen
          requests={requests}
          fetchPage={fetchRequestPage}
          reloadKey={dataVersion}
          onIssue={issueRedemption}
          onReject={rejectRequest}
        />
      );
    }

    if (isAdmin && activeTab === 'staff') {
      return (
        <StaffScreen
          staffList={staffList}
          currentStaffId={staff.id}
          onCreate={createStaff}
          onUpdate={updateStaff}
          onSetActive={setStaffActive}
        />
      );
    }

    return (
      <AdminDashboardScreen
        stats={stats}
        requests={requests}
        onOpenIssuedLog={() => setIssuedLogOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        inactiveCount={inactiveCount}
        inactiveDays={inactiveDays}
        onOpenInactive={() => setInactiveOpen(true)}
      />
    );
  }

  return (
    <AppFrame
      header={{
        eyebrow: isAdmin ? 'Admin panel' : 'Cashier panel',
        title: staff.name,
        pill: isAdmin ? 'Admin' : 'Cashier',
        caption: pendingSummary,
        actions: [
          ...(isAdmin ? [{ icon: 'bell', label: 'Alerts', badge: inactiveCount, onPress: () => setInactiveOpen(true) }] : []),
          { icon: 'user', label: 'Account', onPress: () => setAccountOpen(true) },
          { icon: 'logout', label: 'Logout', onPress: logout },
        ],
      }}
      tabs={tabs.map((tab) => ({
        ...tab,
        badge: tab.key === 'requests' ? pendingRequests.length : tab.key === 'fuelClaims' ? pendingClaims.length : 0,
      }))}
      activeKey={activeTab}
      onChangeTab={goToTab}
    >
      {renderScreen()}
    </AppFrame>
  );
}
