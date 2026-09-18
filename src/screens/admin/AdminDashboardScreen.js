import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';

export default function AdminDashboardScreen({ customers, requests }) {
  const totalCustomers = customers.length;
  const pending = requests.filter((r) => r.status === 'pending');
  const totalOutstanding = customers.reduce((sum, c) => sum + c.points, 0);
  const totalIssued = customers.reduce((sum, c) => sum + c.lifetimePoints, 0);
  const totalRedeemed = customers.reduce(
    (sum, c) => sum + c.history.filter((h) => h.type === 'redeem').reduce((s, h) => s + h.amount, 0),
    0
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Program overview</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalCustomers}</Text>
            <Text style={styles.statLabel}>Total Customers</Text>
          </View>
          <View style={[styles.statCard, pending.length > 0 && styles.statCardAlert]}>
            <Text style={[styles.statValue, pending.length > 0 && styles.statValueAlert]}>{pending.length}</Text>
            <Text style={styles.statLabel}>Pending Requests</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalOutstanding.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Outstanding Points</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalIssued.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Lifetime Points Issued</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Points Redeemed So Far</Text>
          <Text style={styles.bigNumber}>{totalRedeemed.toLocaleString()}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Pending Requests</Text>
          {pending.length === 0 ? (
            <Text style={styles.emptyText}>No pending redemption requests.</Text>
          ) : (
            pending.slice(0, 5).map((r) => (
              <View key={r.id} style={styles.requestRow}>
                <Text style={styles.requestIcon}>{r.rewardIcon}</Text>
                <View style={styles.requestText}>
                  <Text style={styles.requestName}>{r.rewardName}</Text>
                  <Text style={styles.requestCustomer}>
                    {r.customerName} · {r.customerPhone}
                  </Text>
                </View>
                <Text style={styles.requestPoints}>{r.points.toLocaleString()} pts</Text>
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
  },
  headerTitle: {
    color: COLORS.textOnPrimary,
    fontSize: FONT.title,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  statCardAlert: {
    backgroundColor: '#FEF3C7',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statValueAlert: {
    color: '#B45309',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT.label,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  bigNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.success,
  },
  emptyText: {
    fontSize: FONT.body,
    color: COLORS.textSecondary,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  requestIcon: {
    fontSize: 24,
  },
  requestText: {
    flex: 1,
  },
  requestName: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  requestCustomer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  requestPoints: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
