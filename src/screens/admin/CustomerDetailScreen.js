import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getTierInfo } from '../../utils/tiers';
import { vehicleLabel } from '../../utils/vehicles';
import FuelEntryForm from './FuelEntryForm';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function CustomerDetailScreen({ customer, onBack, onCreditPoints }) {
  const { current, next, pointsToNext } = getTierInfo(customer.lifetimePoints);

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
              {customer.vehicles.map((v) => (
                <Text key={v.id} style={styles.profileLine}>
                  🚗 {vehicleLabel(v)}
                </Text>
              ))}
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

        {onCreditPoints ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Fuel Filling</Text>
            <FuelEntryForm customer={customer} onCreditPoints={onCreditPoints} />
          </View>
        ) : null}

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
                  <Text style={styles.historyDate}>
                    {formatDate(entry.date)}
                    {entry.by ? ` · by ${entry.by}` : ''}
                  </Text>
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
