import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiRequest } from '../../api/client';
import ClaimPhoto from '../../components/ClaimPhoto';
import RewardImage from '../../components/RewardImage';
import { ISSUE_LOG_DEFAULT_DAYS } from '../../utils/issueLog';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';

const PERIODS = [
  { key: '7', label: '7 days' },
  { key: '30', label: '30 days' },
  { key: '60', label: '60 days' },
  { key: '90', label: '90 days' },
  { key: '180', label: '6 months' },
  { key: 'all', label: 'All time' },
  { key: 'custom', label: 'Custom' },
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// The handover photo is only fetched when asked for, so a long list does not download a photo per row.
function HandoverPhoto({ id }) {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Pressable style={styles.photoToggle} onPress={() => setShown((v) => !v)}>
        <Text style={styles.photoToggleText}>{shown ? 'Hide handover photo' : 'View handover photo'}</Text>
      </Pressable>
      {shown ? <ClaimPhoto path={`/redemption-requests/${id}/photo`} claimId={id} style={styles.handoverPhoto} /> : null}
    </>
  );
}

// The report is computed by the server over every issued item (nothing is ever deleted), so it stays correct however many
// there are. The app only shows what the server sends.
export default function IssuedItemsScreen({ onBack }) {
  const [period, setPeriod] = useState(String(ISSUE_LOG_DEFAULT_DAYS));
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [range, setRange] = useState(null); // the custom range that was applied: { from, to }
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rangeError, setRangeError] = useState('');

  useEffect(() => {
    if (period === 'custom' && !range) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    const params = period === 'custom' ? `from=${range.from}&to=${range.to}` : `days=${period}`;
    apiRequest(`/reports/issued-items?${params}`)
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, range]);

  function applyRange() {
    if (!DATE_PATTERN.test(from.trim()) || !DATE_PATTERN.test(to.trim())) {
      setRangeError('Enter both dates as YYYY-MM-DD, for example 2026-10-01.');
      return;
    }
    if (from.trim() > to.trim()) {
      setRangeError('The start date must be on or before the end date.');
      return;
    }
    setRangeError('');
    setRange({ from: from.trim(), to: to.trim() });
  }

  const summary = report?.summary;
  const items = report?.items ?? [];
  const byItem = report?.byItem ?? [];
  const byCustomer = report?.byCustomer ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.backText}>‹ Dashboard</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Gifts Allotted</Text>
        <Text style={styles.headerSubtitle}>Track record of gifts handed over to customers</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <Pressable
              key={p.key}
              style={[styles.periodChip, period === p.key && styles.periodChipActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        {period === 'custom' && (
          <View style={styles.card}>
            <View style={styles.dateRow}>
              <TextInput
                style={styles.dateInput}
                placeholder="From (YYYY-MM-DD)"
                placeholderTextColor={COLORS.textMuted}
                value={from}
                onChangeText={setFrom}
                autoCapitalize="none"
                maxLength={10}
              />
              <TextInput
                style={styles.dateInput}
                placeholder="To (YYYY-MM-DD)"
                placeholderTextColor={COLORS.textMuted}
                value={to}
                onChangeText={setTo}
                autoCapitalize="none"
                maxLength={10}
              />
            </View>
            {rangeError ? <Text style={styles.errorText}>{rangeError}</Text> : null}
            <Pressable style={styles.applyButton} onPress={applyRange}>
              <Text style={styles.applyButtonText}>Show this range</Text>
            </Pressable>
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {loading ? <ActivityIndicator color={COLORS.primary} style={styles.spinner} /> : null}

        {report && !loading && (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.totalItems}</Text>
                <Text style={styles.summaryLabel}>Items issued</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.totalPoints.toLocaleString()}</Text>
                <Text style={styles.summaryLabel}>Points redeemed</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.customerCount}</Text>
                <Text style={styles.summaryLabel}>Customers</Text>
              </View>
            </View>

            {byItem.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>By item</Text>
                {byItem.map((item) => (
                  <View key={item.rewardId} style={styles.itemRow}>
                    <RewardImage id={item.rewardId} size={40} radius={10} />
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemCount}>× {item.count}</Text>
                  </View>
                ))}
              </View>
            )}

            {byCustomer.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>By customer</Text>
                {byCustomer.map((c) => (
                  <View key={c.customerId} style={styles.itemRow}>
                    <View style={styles.itemName}>
                      <Text style={styles.customerName}>{c.name}</Text>
                      <Text style={styles.customerPhone}>{c.phone}</Text>
                    </View>
                    <Text style={styles.itemCount}>
                      {c.count} gift{c.count === 1 ? '' : 's'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>Issue records</Text>
            {items.length === 0 ? (
              <Text style={styles.emptyText}>No items were issued in this period.</Text>
            ) : (
              items.map((r) => (
                <View key={r.id} style={styles.recordCard}>
                  <View style={styles.recordRow}>
                    <RewardImage id={r.reward.id} size={56} />
                    <View style={styles.recordText}>
                      <Text style={styles.recordName}>{r.reward.name}</Text>
                      <Text style={styles.recordCustomer}>
                        {r.customer?.name} · {r.customer?.phone}
                      </Text>
                      <Text style={styles.recordMeta}>
                        {formatDate(r.resolvedAt)}
                        {r.resolvedBy ? ` · handed over by ${r.resolvedBy}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.recordPoints}>{r.reward.points.toLocaleString()} pts</Text>
                  </View>
                  {r.handover?.photoUrl ? <HandoverPhoto id={r.id} /> : null}
                </View>
              ))
            )}
          </>
        )}

        <Text style={styles.footnote}>
          Issue records are never deleted, so any period can be looked up here, including dates far in the past.
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
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  customerName: {
    fontSize: FONT.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  customerPhone: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  photoToggle: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.xs,
  },
  photoToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  handoverPhoto: {
    width: '100%',
    height: 180,
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
  dateRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT.body,
    color: COLORS.textPrimary,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  applyButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
  },
  spinner: {
    marginVertical: SPACING.lg,
  },
});
