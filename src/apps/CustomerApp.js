import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import CatalogScreen from '../screens/CatalogScreen';
import RedemptionsScreen from '../screens/RedemptionsScreen';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { COLORS, SPACING } from '../theme';

const TABS = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'catalog', label: 'Rewards', icon: '🎁' },
  { key: 'redemptions', label: 'History', icon: '📜' },
];

export default function CustomerApp() {
  const [activeTab, setActiveTab] = useState('home');
  const insets = useSafeAreaInsets();
  const { customerPhone, logout } = useAuth();
  const { getCustomerByPhone, requests, requestRedemption } = useSession();

  const customer = getCustomerByPhone(customerPhone);

  if (!customer) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your account…</Text>
      </View>
    );
  }

  const myPendingRequests = requests.filter((r) => r.customerPhone === customerPhone && r.status === 'pending');

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.topStrip}>
        <Text style={styles.topStripText} numberOfLines={1}>
          Hi, <Text style={styles.topStripName}>{customer.name}</Text>
        </Text>
        <Pressable onPress={logout}>
          <Text style={styles.logoutLink}>Logout</Text>
        </Pressable>
      </View>

      <View style={styles.screen}>
        {activeTab === 'home' && <HomeScreen customer={customer} />}
        {activeTab === 'catalog' && (
          <CatalogScreen
            customer={customer}
            pendingRequests={myPendingRequests}
            onRequestRedeem={(reward) => requestRedemption(customer.phone, reward)}
          />
        )}
        {activeTab === 'redemptions' && <RedemptionsScreen customer={customer} requests={requests} />}
      </View>

      <View style={[styles.tabBar, { paddingBottom: insets.bottom + SPACING.sm }]}>
        {TABS.map((tab) => {
          const focused = tab.key === activeTab;
          return (
            <Pressable key={tab.key} style={styles.tabButton} onPress={() => setActiveTab(tab.key)}>
              <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{tab.label}</Text>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
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
});
