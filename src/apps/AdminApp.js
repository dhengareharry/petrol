import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import CustomerDetailScreen from '../screens/admin/CustomerDetailScreen';
import RedeemRequestsScreen from '../screens/admin/RedeemRequestsScreen';
import CustomersScreen from '../screens/CustomersScreen';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { COLORS, SPACING } from '../theme';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'customers', label: 'Customers', icon: '👤' },
  { key: 'requests', label: 'Requests', icon: '📥' },
];

export default function AdminApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewingPhone, setViewingPhone] = useState(null);
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { customers, requests, pendingRequests, addCustomer, creditPoints, approveRequest, rejectRequest, getCustomerByPhone } =
    useSession();

  const viewingCustomer = viewingPhone ? getCustomerByPhone(viewingPhone) : null;

  function goToTab(key) {
    setViewingPhone(null);
    setActiveTab(key);
  }

  function renderScreen() {
    if (activeTab === 'customers') {
      if (viewingCustomer) {
        return (
          <CustomerDetailScreen
            customer={viewingCustomer}
            onBack={() => setViewingPhone(null)}
            onCreditPoints={creditPoints}
          />
        );
      }
      return <CustomersScreen customers={customers} onSelect={setViewingPhone} onCreate={addCustomer} />;
    }

    if (activeTab === 'requests') {
      return <RedeemRequestsScreen requests={requests} onApprove={approveRequest} onReject={rejectRequest} />;
    }

    return <AdminDashboardScreen customers={customers} requests={requests} />;
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.topStrip}>
        <Text style={styles.topStripText}>
          🛠️ <Text style={styles.topStripName}>Admin</Text>
          {pendingRequests.length > 0 ? ` · ${pendingRequests.length} pending` : ''}
        </Text>
        <Pressable onPress={logout}>
          <Text style={styles.logoutLink}>Logout</Text>
        </Pressable>
      </View>

      <View style={styles.screen}>{renderScreen()}</View>

      <View style={[styles.tabBar, { paddingBottom: insets.bottom + SPACING.sm }]}>
        {TABS.map((tab) => {
          const focused = tab.key === activeTab;
          return (
            <Pressable key={tab.key} style={styles.tabButton} onPress={() => goToTab(tab.key)}>
              <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{tab.label}</Text>
              {tab.key === 'requests' && pendingRequests.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingRequests.length}</Text>
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
