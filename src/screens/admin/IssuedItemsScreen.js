import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ISSUE_LOG_DEFAULT_DAYS, getIssuedItems } from '../../utils/issueLog';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';

const PERIODS = [
  { key: 7, label: '7 days' },
  { key: 30, label: '30 days' },
  { key: ISSUE_LOG_DEFAULT_DAYS, label: `${ISSUE_LOG_DEFAULT_DAYS} days` },
  { key: null, label: 'All time' },
];

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function IssuedItemsScreen({ requests, onBack }) {
  const [days, setDays] = useState(ISSUE_LOG_DEFAULT_DAYS);

  const issued = useMemo(() => getIssuedItems(requests, days), [requests, days]);
  const totalPoints = issued.reduce((sum, r) => sum + r.points, 0);
  const customerCount = new Set(issued.map((r) => r.customerPhone)).size;

  const byItem = useMemo(() => {
    const counts = new Map();
    issued.forEach((r) => {
      const entry = counts.get(r.rewardId) || { name: r.rewardName, icon: r.rewardIcon, count: 0 };
      entry.count += 1;
      counts.set(r.rewardId, entry);
    });
    return [...counts.values()].sort((a, b) => b.count - a.count);
  }, [issued]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.backText}>‹ Dashboard</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Items Issued Log</Text>
        <Text style={styles.headerSubtitle}>Rewards handed over to customers</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <Pressable
              key={String(p.key)}
              style={[styles.periodChip, days === p.key && styles.periodChipActive]}
              onPress={() => setDays(p.key)}
            >
              <Text style={[styles.periodText, days === p.key && styles.periodTextActive]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{issued.length}</Text>
            <Text style={styles.summaryLabel}>Items issued</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalPoints.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Points redeemed</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{customerCount}</Text>
            <Text style={styles.summaryLabel}>Customers</Text>
          </View>
        </View>

        {byItem.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>By item</Text>
            {byItem.map((item) => (
              <View key={item.name} style={styles.itemRow}>
                <Text style={styles.itemIcon}>{item.icon}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCount}>× {item.count}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Issue records</Text>
        {issued.length === 0 ? (
          <Text style={styles.emptyText}>No items were issued in this period.</Text>
        ) : (
          issued.map((r) => (
            <View key={r.id} style={styles.recordCard}>
              <Text style={styles.recordIcon}>{r.rewardIcon}</Text>
              <View style={styles.recordText}>
                <Text style={styles.recordName}>{r.rewardName}</Text>
                <Text style={styles.recordCustomer}>
                  {r.customerName} · {r.customerPhone}
                </Text>
                <Text style={styles.recordMeta}>
                  {formatDate(r.resolvedDate)}
                  {r.resolvedBy ? ` · issued by ${r.resolvedBy}` : ''}
                </Text>
              </View>
              <Text style={styles.recordPoints}>{r.points.toLocaleString()} pts</Text>
            </View>
          ))
        )}

        <Text style={styles.footnote}>
          Issue records are never deleted automatically, so at least {ISSUE_LOG_DEFAULT_DAYS} days of history is always
          available here.
        </Text>
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
  headerSubtitle: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: 12,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  periodChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  periodChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  periodTextActive: {
    color: COLORS.textOnPrimary,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT.label,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  itemIcon: {
    fontSize: 20,
  },
  itemName: {
    flex: 1,
    fontSize: FONT.body,
    color: COLORS.textPrimary,
  },
  itemCount: {
    fontSize: FONT.body,
    fontWeight: '800',
    color: COLORS.primary,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  recordIcon: {
    fontSize: 30,
  },
  recordText: {
    flex: 1,
  },
  recordName: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  recordCustomer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  recordMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  recordPoints: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT.body,
  },
  footnote: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginTop: SPACING.sm,
  },
});
