import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ClaimPhoto from '../components/ClaimPhoto';
import RewardImage from '../components/RewardImage';
import ScreenHeader from '../components/ScreenHeader';
import { COLORS, FONT, RADIUS, SHADOW, SPACING } from '../theme';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString();
}

const STATUS_LABEL = {
  pending: 'Pending admin approval',
  approved: 'Ready for pickup',
  rejected: 'Rejected',
};

const STATUS_STYLE_KEY = {
  pending: 'statusPending',
  approved: 'statusApproved',
  rejected: 'statusRejected',
};

export default function RedemptionsScreen({ customer, requests, claims = [] }) {
  const myRequests = requests.filter((r) => r.customerPhone === customer.phone);

  // Built from the customer's redemption requests (their points ledger is paged, so it isn't the full story).
  const items = myRequests
    .map((r) => ({
      id: r.id,
      rewardId: r.rewardId,
      rewardName: r.rewardName,
      points: r.points,
      status: r.status,
      date: r.status === 'approved' && r.resolvedDate ? r.resolvedDate : r.requestedDate,
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const redeemedCount = items.filter((item) => item.status === 'approved').length;

  // Fill-ups the cashier recorded (with a dashboard photo and location) or that were approved after a review.
  const fillUps = claims.filter((c) => c.customerPhone === customer.phone && c.status !== 'pending');

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="My history"
        subtitle={`${redeemedCount} item${redeemedCount === 1 ? '' : 's'} redeemed so far`}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>No redemptions yet. Visit the Rewards tab once you have enough points.</Text>
        ) : (
          items.map((item) => {
            return (
              <View key={item.id} style={styles.card}>
                <RewardImage id={item.rewardId} size={56} />
                <View style={styles.cardText}>
                  <Text style={styles.itemName}>{item.rewardName}</Text>
                  <Text style={styles.itemDate}>Requested on {formatDate(item.date)}</Text>
                </View>
                <View style={styles.rightCol}>
                  <Text style={styles.itemPoints}>-{item.points.toLocaleString()} pts</Text>
                  <Text style={[styles.statusBadge, styles[STATUS_STYLE_KEY[item.status]]]}>
                    {STATUS_LABEL[item.status]}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        <Text style={styles.sectionTitle}>Fuel fill-ups</Text>
        {fillUps.length === 0 ? (
          <Text style={styles.emptyText}>No fill-ups recorded yet.</Text>
        ) : (
          fillUps.map((claim) => (
            <View key={claim.id} style={styles.card}>
              <ClaimPhoto claimId={claim.id} style={styles.thumb} />
              <View style={styles.cardText}>
                <Text style={styles.itemName}>₹{claim.claimedAmountRupees.toLocaleString()}</Text>
                <Text style={styles.itemDate}>
                  {formatDate(claim.submittedDate)}
                  {claim.vehicleNumber ? ` · ${claim.vehicleNumber}` : ''}
                </Text>
                {claim.status === 'rejected' && claim.rejectionReason ? (
                  <Text style={styles.reason}>Reason: {claim.rejectionReason}</Text>
                ) : null}
              </View>
              <View style={styles.rightCol}>
                <Text style={claim.status === 'approved' ? styles.earned : styles.itemPoints}>
                  {claim.status === 'approved' ? `+${claim.pointsAwarded} pts` : 'Rejected'}
                </Text>
                {claim.resolvedBy ? <Text style={styles.itemDate}>by {claim.resolvedBy}</Text> : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: FONT.label,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  thumb: {
    width: 56,
    height: 56,
  },
  earned: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.success,
  },
  reason: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: SPACING.xs,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT.body,
    textAlign: 'center',
    marginTop: SPACING.xxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOW.card,
  },
  cardText: {
    flex: 1,
  },
  itemName: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  itemDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  itemPoints: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  statusPending: {
    color: COLORS.accentText,
    backgroundColor: COLORS.accentSoft,
  },
  statusApproved: {
    color: COLORS.success,
    backgroundColor: COLORS.successSoft,
  },
  statusRejected: {
    color: COLORS.danger,
    backgroundColor: COLORS.dangerSoft,
  },
});
