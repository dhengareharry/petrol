import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from '../../components/Icon';
import IconTile from '../../components/IconTile';
import RewardImage from '../../components/RewardImage';
import ScreenHeader from '../../components/ScreenHeader';
import { ISSUE_LOG_DEFAULT_DAYS } from '../../utils/issueLog';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';

export default function AdminDashboardScreen({
  stats,
  requests,
  onOpenIssuedLog,
  onOpenSettings,
  inactiveCount = 0,
  inactiveDays = 30,
  onOpenInactive,
}) {
  const issuedRecent = stats?.itemsIssuedLast45Days ?? 0;
  const totalCustomers = stats?.totalCustomers ?? 0;
  const pending = requests.filter((r) => r.status === 'pending');
  const totalOutstanding = stats?.outstandingPoints ?? 0;
  const totalIssued = stats?.lifetimePointsIssued ?? 0;
  const totalRedeemed = stats?.pointsRedeemed ?? 0;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Admin dashboard" subtitle="Program overview" />

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          style={[styles.alertCard, inactiveCount > 0 && styles.alertCardActive]}
          onPress={onOpenInactive}
          accessibilityRole="button"
          accessibilityLabel="Inactive vehicles"
        >
          <IconTile
            name={inactiveCount > 0 ? 'alert' : 'checkCircle'}
            size={44}
            color={inactiveCount > 0 ? COLORS.accent : COLORS.success}
            background={inactiveCount > 0 ? COLORS.accentSoft : COLORS.successSoft}
          />
          <View style={styles.issuedText}>
            <Text style={styles.alertTitle}>Inactive vehicles</Text>
            <Text style={styles.alertSubtitle}>
              {inactiveCount > 0
                ? `${inactiveCount} vehicle${inactiveCount === 1 ? ' has' : 's have'} not filled fuel for more than ${inactiveDays} days`
                : `Every vehicle has filled fuel in the last ${inactiveDays} days`}
            </Text>
          </View>
          {inactiveCount > 0 ? (
            <View style={styles.alertCount}>
              <Text style={styles.alertCountText}>{inactiveCount}</Text>
            </View>
          ) : null}
          <Icon name="chevronRight" size={20} color={COLORS.textMuted} />
        </Pressable>

        <Pressable style={styles.issuedButton} onPress={onOpenIssuedLog}>
          <IconTile name="package" size={44} color={COLORS.accent} background={COLORS.accentSoft} />
          <View style={styles.issuedText}>
            <Text style={styles.issuedTitle}>Items Issued Log</Text>
            <Text style={styles.issuedSubtitle}>
              {issuedRecent} item{issuedRecent === 1 ? '' : 's'} issued in the last {ISSUE_LOG_DEFAULT_DAYS} days
            </Text>
          </View>
          <Icon name="chevronRight" size={20} color={COLORS.textMuted} />
        </Pressable>

        <Pressable style={styles.issuedButton} onPress={onOpenSettings}>
          <IconTile name="sliders" size={44} />
          <View style={styles.issuedText}>
            <Text style={styles.issuedTitle}>Program Settings</Text>
            <Text style={styles.issuedSubtitle}>Fuel rate, minimum fill-up and referral bonus</Text>
          </View>
          <Icon name="chevronRight" size={20} color={COLORS.textMuted} />
        </Pressable>

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
                <RewardImage id={r.rewardId} size={44} radius={10} />
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
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  alertCardActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentSoft,
  },
  alertTitle: {
    fontSize: FONT.label,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  alertSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  alertCount: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCountText: {
    color: COLORS.textOnPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  issuedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  issuedIcon: {
    fontSize: 28,
  },
  issuedText: {
    flex: 1,
  },
  issuedTitle: {
    color: COLORS.textOnPrimary,
    fontSize: FONT.label,
    fontWeight: '800',
  },
  issuedSubtitle: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  issuedArrow: {
    color: COLORS.accent,
    fontSize: 24,
    fontWeight: '800',
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
