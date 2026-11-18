import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import ConnectionScreen from './src/components/ConnectionScreen';
import ErrorBoundary from './src/components/ErrorBoundary';
import LoginScreen from './src/screens/LoginScreen';
import AdminApp from './src/apps/AdminApp';
import CustomerApp from './src/apps/CustomerApp';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ConfirmProvider } from './src/context/ConfirmContext';
import { RulesProvider } from './src/context/RulesContext';
import { FixedLanguage, I18nProvider, useI18n } from './src/i18n';
import { SessionProvider, useSession } from './src/context/SessionContext';
import Logo from './src/components/Logo';
import { COLORS } from './src/theme';

function AppRouter() {
  const auth = useAuth();
  const session = useSession();
  const { ready, t } = useI18n();

  if (auth.loading || session.loading || !ready) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Logo size={120} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  // A saved sign-in exists but the server could not be reached: say so, and let the user retry.
  if (auth.connectionError) return <ConnectionScreen onRetry={auth.retryRestore} />;

  if (auth.role === 'admin' || auth.role === 'cashier') {
    return (
      <FixedLanguage code="en">
        <AdminApp />
      </FixedLanguage>
    );
  }

  if (auth.role === 'customer') {
    return <CustomerApp />;
  }

  // Not signed in: one login screen for everyone. Signing in opens the customer or staff panel by itself.
  return <LoginScreen onLogin={auth.login} onRegister={auth.registerAsCustomer} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <RulesProvider>
          <AuthProvider>
            <SessionProvider>
              <View style={styles.root}>
                <ErrorBoundary>
                  <ConfirmProvider>
                    <AppRouter />
                  </ConfirmProvider>
                </ErrorBoundary>
                <StatusBar style="light" />
              </View>
            </SessionProvider>
          </AuthProvider>
        </RulesProvider>
      </I18nProvider>
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
    marginTop: 12,
  },
});
