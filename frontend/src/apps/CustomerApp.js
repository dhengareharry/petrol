import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AppFrame from '../components/AppFrame';
import { useI18n } from '../i18n';

import HomeScreen from '../screens/HomeScreen';
import CatalogScreen from '../screens/CatalogScreen';
import RedemptionsScreen from '../screens/RedemptionsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import { useConfirm } from '../context/ConfirmContext';
import { COLORS, SPACING } from '../theme';

const TABS = [
  { key: 'home', labelKey: 'tab.home', icon: 'home' },
  { key: 'catalog', labelKey: 'tab.rewards', icon: 'gift' },
  { key: 'redemptions', labelKey: 'tab.history', icon: 'history' },
  { key: 'profile', labelKey: 'tab.profile', icon: 'user' },
];

export default function CustomerApp() {
  const [activeTab, setActiveTab] = useState('home');
  const { t } = useI18n();
  const { customerPhone, logout } = useAuth();
  const confirm = useConfirm();
  const {
    getCustomerByPhone,
    requests,
    requestRedemption,
    cancelRedemption,
    claims,
    updateProfileName,
    changePin,
    deleteAccount,
    addVehicle,
    updateVehicle,
    removeVehicle,
    loading,
    refresh,
  } = useSession();

  const customer = getCustomerByPhone(customerPhone);

  async function confirmLogout() {
    const ok = await confirm({
      title: t('logout.title'),
      message: t('logout.text'),
      confirmLabel: t('common.logout'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      icon: 'logout',
    });
    if (ok) await logout();
  }

  if (!customer) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{loading ? t('app.loadingAccount') : t('app.loadAccountFailed')}</Text>
        {!loading && (
          <>
            <Pressable onPress={() => refresh().catch(() => undefined)}>
              <Text style={styles.retryLink}>{t('common.tryAgain')}</Text>
            </Pressable>
            <Pressable onPress={logout}>
              <Text style={styles.logoutLink}>{t('common.logout')}</Text>
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
        eyebrow: t('app.welcomeBack'),
        title: customer.name,
        actions: [{ icon: 'logout', label: t('common.logout'), onPress: confirmLogout }],
      }}
      tabs={TABS.map((tab) => ({ ...tab, label: t(tab.labelKey) }))}
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
            onDeleteAccount={async (pin) => {
              await deleteAccount(pin);
              await logout(); // the account is gone, so this just clears the device
            }}
          />
        )}
        {activeTab === 'redemptions' && <RedemptionsScreen customer={customer} requests={requests} claims={claims} onCancel={cancelRedemption} />}
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
