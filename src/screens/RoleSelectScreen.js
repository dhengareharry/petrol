import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT, RADIUS, SPACING } from '../theme';

export default function RoleSelectScreen({ onPickCustomer, onPickAdmin }) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>⛽</Text>
      <Text style={styles.title}>Pump Rewards</Text>
      <Text style={styles.subtitle}>Fuel loyalty &amp; redemption program</Text>

      <Pressable style={[styles.card, styles.customerCard]} onPress={onPickCustomer}>
        <Text style={styles.cardIcon}>👤</Text>
        <Text style={styles.cardTitle}>I'm a Customer</Text>
        <Text style={styles.cardText}>Check your points, browse rewards, and request redemptions.</Text>
      </Pressable>

      <Pressable style={[styles.card, styles.adminCard]} onPress={onPickAdmin}>
        <Text style={styles.cardIcon}>🛠️</Text>
        <Text style={styles.cardTitle}>I'm an Admin</Text>
        <Text style={styles.cardText}>Manage customers, credit fuel points, and approve redemptions.</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  logo: {
    fontSize: 56,
    marginBottom: SPACING.sm,
  },
  title: {
    color: COLORS.textOnPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: FONT.body,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xxxl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  customerCard: {
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  adminCard: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: FONT.title,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  cardText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
