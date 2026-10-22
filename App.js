import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import RoleSelectScreen from './src/screens/RoleSelectScreen';
import StaffLoginScreen from './src/screens/StaffLoginScreen';
import CustomerLoginScreen from './src/screens/CustomerLoginScreen';
import AdminApp from './src/apps/AdminApp';
import CustomerApp from './src/apps/CustomerApp';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SessionProvider, useSession } from './src/context/SessionContext';
import { COLORS } from './src/theme';

function AppRouter() {
  const [view, setView] = useState('role'); // 'role' | 'staffLogin' | 'customerLogin'
  const auth = useAuth();
  const session = useSession();
  const wasLoggedIn = useRef(false);

  useEffect(() => {
    if (auth.role) {
      wasLoggedIn.current = true;
    } else if (wasLoggedIn.current) {
      wasLoggedIn.current = false;
      setView('role');
    }
  }, [auth.role]);

  if (auth.loading || session.loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading…</Text>
      </SafeAreaView>
    );
  }

  if (auth.role === 'admin' || auth.role === 'cashier') {
    return <AdminApp />;
  }

  if (auth.role === 'customer') {
    return <CustomerApp />;
  }

  if (view === 'staffLogin') {
    return <StaffLoginScreen onLogin={auth.loginAsStaff} onBack={() => setView('role')} />;
  }

  if (view === 'customerLogin') {
    return (
      <CustomerLoginScreen
        onLogin={auth.loginAsCustomer}
        onRegister={async (values) => {
          const created = await session.addCustomer(values);
          await auth.loginCustomerSession(created.phone);
        }}
        onBack={() => setView('role')}
      />
    );
  }

  return <RoleSelectScreen onPickCustomer={() => setView('customerLogin')} onPickStaff={() => setView('staffLogin')} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SessionProvider>
          <View style={styles.root}>
            <AppRouter />
            <StatusBar style="light" />
          </View>
        </SessionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.primary,
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
});
