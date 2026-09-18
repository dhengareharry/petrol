import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getTierInfo } from '../../utils/tiers';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';

function notify(title, message) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const QUICK_AMOUNTS = [100, 250, 500, 1000];

export default function CustomerDetailScreen({ customer, onBack, onCreditPoints }) {
  const [litres, setLitres] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { current, next, pointsToNext } = getTierInfo(customer.lifetimePoints);

  async function submit(amount) {
    const value = Number(amount);
    if (!value || value <= 0) {
      notify('Invalid amount', 'Enter a litre amount greater than 0.');
      return;
    }
    setSubmitting(true);
    try {
      await onCreditPoints(customer.phone, value);
      setLitres('');
      notify('Points added', `${value.toLocaleString()} points credited to ${customer.name}.`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.backText}>‹ Customers</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{customer.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <Text style={styles.tierIcon}>{current.icon}</Text>
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{customer.name}</Text>
              <Text style={styles.profileLine}>{customer.phone}</Text>
              {customer.vehicleNumber ? <Text style={styles.profileLine}>{customer.vehicleNumber}</Text> : null}
            </View>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{customer.points.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Points Balance</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{customer.lifetimePoints.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Lifetime Points</Text>
            </View>
          </View>
          <Text style={styles.tierText}>
            {current.label} member{next ? ` · ${pointsToNext.toLocaleString()} pts to ${next.label}` : ' · Top tier'}
          </Text>
          <Text style={styles.joinedText}>Joined {formatDate(customer.joinedDate)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Credit Fuel Points</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Litres filled"
            placeholderTextColor={COLORS.textMuted}
            value={litres}
            onChangeText={setLitres}
          />
          <Pressable
            style={[styles.primaryButton, submitting && styles.disabled]}
            disabled={submitting}
            onPress={() => submit(litres)}
          >
            <Text style={styles.primaryButtonText}>{submitting ? 'Adding…' : 'Add Points'}</Text>
          </Pressable>
          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((amount) => (
              <Pressable
                key={amount}
                style={[styles.quickButton, submitting && styles.disabled]}
                disabled={submitting}
                onPress={() => submit(amount)}
              >
                <Text style={styles.quickButtonText}>+{amount}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Activity History</Text>
          {customer.history.length === 0 ? (
            <Text style={styles.emptyText}>No activity yet.</Text>
          ) : (
            customer.history.map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <View
                  style={[
                    styles.historyDot,
                    entry.type === 'redeem' ? styles.historyDotRedeem : styles.historyDotEarn,
                  ]}
                />
                <View style={styles.historyTextWrap}>
                  <Text style={styles.historyLabel}>{entry.label}</Text>
                  <Text style={styles.historyDate}>{formatDate(entry.date)}</Text>
                </View>
                <Text style={[styles.historyAmount, entry.type === 'redeem' ? styles.negative : styles.positive]}>
                  {entry.type === 'redeem' ? '-' : '+'}
                  {entry.amount.toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  backText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitle: {
    color: COLORS.textOnPrimary,
    fontSize: FONT.title,
    fontWeight: '800',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  tierIcon: {
    fontSize: 36,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: FONT.title,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  profileLine: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  tierText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  joinedText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT.label,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT.label,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  disabled: {
    opacity: 0.6,
  },
  quickRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    marginTop: SPACING.md,
  },
  quickButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  quickButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyText: {
    fontSize: FONT.body,
    color: COLORS.textSecondary,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyDotEarn: {
    backgroundColor: COLORS.success,
  },
  historyDotRedeem: {
    backgroundColor: COLORS.danger,
  },
  historyTextWrap: {
    flex: 1,
  },
  historyLabel: {
    fontSize: FONT.body,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  historyAmount: {
    fontSize: FONT.body,
    fontWeight: '700',
  },
  positive: {
    color: COLORS.success,
  },
  negative: {
    color: COLORS.danger,
  },
});
