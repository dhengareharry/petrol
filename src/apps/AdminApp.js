import { useState } from 'react';//yghg
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import CustomerDetailScreen from '../screens/admin/CustomerDetailScreen';
import FuelClaimsScreen from '../screens/admin/FuelClaimsScreen';
import FuelFillingScreen from '../screens/admin/FuelFillingScreen';
import RedeemRequestsScreen from '../screens/admin/RedeemRequestsScreen';
import IssuedItemsScreen from '../screens/admin/IssuedItemsScreen';
import MyAccountScreen from '../screens/admin/MyAccountScreen';
import StaffScreen from '../screens/admin/StaffScreen';
import CustomersScreen from '../screens/CustomersScreen';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { COLORS, SPACING } from '../theme';

const ADMIN_TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'customers', label: 'Customers', icon: '👤' },
  { key: 'fuelClaims', label: 'Fuel Proofs', icon: '📸' },
  { key: 'requests', label: 'Requests', icon: '📥' },
  { key: 'staff', label: 'Staff', icon: '🛠️' },
];

const CASHIER_TABS = [
  { key: 'fuelEntry', label: 'Fuel Entry', icon: '⛽' },
  { key: 'customers', label: 'Customers', icon: '👤' },
  { key: 'fuelClaims', label: 'Fuel Proofs', icon: '📸' },
  { key: 'requests', label: 'Requests', icon: '📥' },
];

export default function AdminApp() {
  const { logout, role, staff: sessionStaff } = useAuth();
  const isAdmin = role === 'admin';
  const tabs = isAdmin ? ADMIN_TABS : CASHIER_TABS;

  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const [viewingPhone, setViewingPhone] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [issuedLogOpen, setIssuedLogOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const {
    customers,
    requests,
    pendingRequests,
    claims,
    pendingClaims,
    staffList,
    addCustomer,
    creditPoints,
    approveRequest,
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
  const rejectClaim = (id) => rejectFuelClaim(id, by);
  const approveRedeem = (id) => approveRequest(id, by);
  const rejectRedeem = (id) => rejectRequest(id, by);

  const viewingCustomer = viewingPhone ? getCustomerByPhone(viewingPhone) : null;

  function goToTab(key) {
    setViewingPhone(null);
    setAccountOpen(false);
    setIssuedLogOpen(false);
    setActiveTab(key);
  }

  function renderScreen() {
    if (accountOpen) {
      return <MyAccountScreen account={staff} onChangePassword={changeOwnPassword} onBack={() => setAccountOpen(false)} />;
    }

    if (isAdmin && issuedLogOpen) {
      return <IssuedItemsScreen requests={requests} onBack={() => setIssuedLogOpen(false)} />;
    }

    // Recording fuel is a cashier-only job; admins never get a way to enter it.
    if (!isAdmin && activeTab === 'fuelEntry') {
      return (
        <FuelFillingScreen customers={customers} onCreditPoints={credit} getCustomerByPhone={getCustomerByPhone} />
      );
    }

    if (activeTab === 'customers') {
      if (viewingCustomer) {
        return (
          <CustomerDetailScreen
            customer={viewingCustomer}
            onBack={() => setViewingPhone(null)}
            onCreditPoints={isAdmin ? undefined : credit}
          />
        );
      }
      return <CustomersScreen customers={customers} onSelect={setViewingPhone} onCreate={addCustomer} />;
    }

    if (activeTab === 'fuelClaims') {
      return <FuelClaimsScreen claims={claims} onApprove={approveClaim} onReject={rejectClaim} />;
    }

    if (activeTab === 'requests') {
      return <RedeemRequestsScreen requests={requests} onApprove={approveRedeem} onReject={rejectRedeem} />;
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
      <AdminDashboardScreen customers={customers} requests={requests} onOpenIssuedLog={() => setIssuedLogOpen(true)} />
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.topStrip}>
        <Text style={styles.topStripText}>
          🛠️ <Text style={styles.topStripName}>{staff.name}</Text> · {isAdmin ? 'Admin' : 'Cashier'}
          {pendingRequests.length > 0 ? ` · ${pendingRequests.length} redeem` : ''}
          {pendingClaims.length > 0 ? ` · ${pendingClaims.length} fuel proof` : ''}
        </Text>
        <View style={styles.topStripActions}>
          <Pressable onPress={() => setAccountOpen(true)}>
            <Text style={styles.logoutLink}>Account</Text>
          </Pressable>
          <Pressable onPress={logout}>
            <Text style={styles.logoutLink}>Logout</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.screen}>{renderScreen()}</View>

      <View style={[styles.tabBar, { paddingBottom: insets.bottom + SPACING.sm }]}>
        {tabs.map((tab) => {
          const focused = tab.key === activeTab;
          const badgeCount =
            tab.key === 'requests' ? pendingRequests.length : tab.key === 'fuelClaims' ? pendingClaims.length : 0;
          return (
            <Pressable key={tab.key} style={styles.tabButton} onPress={() => goToTab(tab.key)}>
              <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{tab.label}</Text>
              {badgeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badgeCount}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  screen: {
    flex: 1,
  },
  topStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  topStripText: {
    flex: 1,
    color: '#D1D5DB',
    fontSize: 13,
  },
  topStripName: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
  },
  topStripActions: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  logoutLink: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderTopWidth: 1,
    borderTopColor: '#1E40AF',
    paddingTop: SPACING.md,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  tabIconFocused: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.primaryLight,
    textAlign: 'center',
  },
  tabLabelFocused: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: '28%',
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: COLORS.textOnPrimary,
    fontSize: 9,
    fontWeight: '800',
  },
});
