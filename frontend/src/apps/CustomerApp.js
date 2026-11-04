import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AppFrame from '../components/AppFrame';

import HomeScreen from '../screens/HomeScreen';
import CatalogScreen from '../screens/CatalogScreen';
import RedemptionsScreen from '../screens/RedemptionsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { COLORS, SPACING } from '../theme';

const TABS = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'catalog', label: 'Rewards', icon: 'gift' },
  { key: 'redemptions', label: 'History', icon: 'history' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

export default function CustomerApp() {
  const [activeTab, setActiveTab] = useState('home');
  const { customerPhone, logout } = useAuth();
  const {
    getCustomerByPhone,
    requests,
    requestRedemption,
    claims,
    updateProfileName,
    changePin,
    addVehicle,
    updateVehicle,
    removeVehicle,
    loading,
    refresh,
  } = useSession();

  const customer = getCustomerByPhone(customerPhone);

  if (!customer) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{loading ? 'Loading your account…' : "Couldn't load your account."}</Text>
        {!loading && (
          <>
            <Pressable onPress={() => refresh().catch(() => undefined)}>
              <Text style={styles.retryLink}>Try again</Text>
            </Pressable>
            <Pressable onPress={logout}>
              <Text style={styles.logoutLink}>Logout</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  const myPendingRequests = requests.filter((r) => r.customerPhone === customerPhone && r.status === 'pending');

  return (
    <AppFrame
      header={{
        eyebrow: 'Welcome back',
        title: customer.name,
        actions: [{ icon: 'logout', label: 'Logout', onPress: logout }],
      }}
      tabs={TABS}
      activeKey={activeTab}
      onChangeTab={setActiveTab}
    >
        {activeTab === 'home' && (
          <HomeScreen
            customer={customer}
            onViewRewards={() => setActiveTab('catalog')}
          />
        )}
        {activeTab === 'catalog' && (
          <CatalogScreen
            customer={customer}
            pendingRequests={myPendingRequests}
            onRequestRedeem={(reward) => requestRedemption(customer.phone, reward)}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileScreen
            customer={customer}
            onUpdateName={updateProfileName}
            onChangePin={changePin}
            onAddVehicle={addVehicle}
            onUpdateVehicle={updateVehicle}
            onRemoveVehicle={removeVehicle}
          />
        )}
        {activeTab === 'redemptions' && <RedemptionsScreen customer={customer} requests={requests} claims={claims} />}
    </AppFrame>
  );
}

const styles = StyleSheet.create({
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
  retryLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: SPACING.lg,
  },
  logoutLink: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '700',
    marginTop: SPACING.lg,
  },
});
