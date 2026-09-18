import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { REWARDS } from '../data/rewards';
import { COLORS, FONT, RADIUS, SPACING } from '../theme';

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

export default function RedemptionsScreen({ customer, requests }) {
  const myRequests = requests.filter((r) => r.customerPhone === customer.phone);

  const approvedFromHistory = customer.history
    .filter((entry) => entry.type === 'redeem')
    .map((entry) => ({
      id: entry.id,
      rewardName: entry.label,
      points: entry.amount,
      status: 'approved',
      date: entry.date,
    }));

  const pendingAndRejected = myRequests
    .filter((r) => r.status !== 'approved')
    .map((r) => ({
      id: r.id,
      rewardName: r.rewardName,
      points: r.points,
      status: r.status,
      date: r.requestedDate,
    }));

  const items = [...pendingAndRejected, ...approvedFromHistory].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Redemptions</Text>
        <Text style={styles.headerSubtitle}>
          {approvedFromHistory.length} item{approvedFromHistory.length === 1 ? '' : 's'} redeemed so far
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>No redemptions yet. Visit the Rewards tab once you have enough points.</Text>
        ) : (
          items.map((item) => {
            const reward = REWARDS.find((r) => r.name === item.rewardName);
            return (
              <View key={item.id} style={styles.card}>
                <Text style={styles.icon}>{reward ? reward.icon : '🎁'}</Text>
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
  },
  icon: {
    fontSize: 30,
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
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  statusPending: {
    color: '#B45309',
  },
  statusApproved: {
    color: COLORS.success,
  },
  statusRejected: {
    color: COLORS.danger,
  },
});
