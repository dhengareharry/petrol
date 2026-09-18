import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { REWARDS } from '../data/rewards';
import { getTierInfo } from '../utils/tiers';
import { REFERRAL_BONUS_POINTS } from '../storage/customerStore';
import { COLORS, FONT, RADIUS, SPACING } from '../theme';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function shareReferralCode(customer) {
  const message = `Join Pump Rewards and start earning fuel points! Use my referral code ${customer.phone} when you sign up.`;
  if (Platform.OS === 'web') {
    if (navigator.share) {
      try {
        await navigator.share({ text: message });
      } catch {
        // user cancelled the share sheet, nothing to do
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(message);
      window.alert('Referral message copied to clipboard!');
    } else {
      window.alert(message);
    }
    return;
  }
  try {
    await Share.share({ message });
  } catch {
    // user dismissed the native share sheet
  }
}

export default function HomeScreen({ customer }) {
  const recent = customer.history.slice(0, 8);
  const { current, next, pointsToNext } = getTierInfo(customer.lifetimePoints);
  const nextReward = REWARDS.find((r) => r.points > customer.points);
  const redeemedCount = customer.history.filter((h) => h.type === 'redeem').length;

  const progress = nextReward ? Math.min(1, customer.points / nextReward.points) : 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.balanceCard}>
        <View style={styles.tierRow}>
          <Text style={styles.tierBadge}>
            {current.icon} {current.label} Member
          </Text>
        </View>
        <Text style={styles.customerName}>{customer.name}</Text>
        <Text style={styles.balanceLabel}>Reward Points</Text>
        <Text style={styles.balanceValue}>{customer.points.toLocaleString()}</Text>
        <Text style={styles.balanceHint}>1 point = 1 litre of fuel purchased</Text>
        {next && (
          <Text style={styles.tierHint}>
            {pointsToNext.toLocaleString()} lifetime points to {next.label} tier
          </Text>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{customer.lifetimePoints.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Lifetime Points</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{redeemedCount}</Text>
          <Text style={styles.statLabel}>Redeemed</Text>
        </View>
      </View>

      {nextReward ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Next Reward</Text>
          <View style={styles.nextRewardRow}>
            <Text style={styles.nextRewardIcon}>{nextReward.icon}</Text>
            <View style={styles.nextRewardText}>
              <Text style={styles.nextRewardName}>{nextReward.name}</Text>
              <Text style={styles.nextRewardPoints}>
                {(nextReward.points - customer.points).toLocaleString()} pts to go
              </Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>All rewards unlocked! 🎉</Text>
        </View>
      )}

      <View style={[styles.card, styles.referralCard]}>
        <Text style={styles.referralTitle}>👥 Refer a Friend, Earn {REFERRAL_BONUS_POINTS} Points</Text>
        <Text style={styles.referralText}>
          Share your referral code with friends. When they sign up using it, you get {REFERRAL_BONUS_POINTS} bonus
          points.
        </Text>
        <View style={styles.referralCodeBox}>
          <Text style={styles.referralCodeLabel}>Your referral code</Text>
          <Text style={styles.referralCode}>{customer.phone}</Text>
        </View>
        <Pressable style={styles.shareButton} onPress={() => shareReferralCode(customer)}>
          <Text style={styles.shareButtonText}>Share Referral Code</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Recent Activity</Text>
      {recent.length === 0 ? (
        <Text style={styles.emptyText}>No activity yet. Fuel purchases will appear here.</Text>
      ) : (
        <View style={styles.historyList}>
          {recent.map((entry) => (
            <View key={entry.id} style={styles.historyRow}>
              <View
                style={[styles.historyDot, entry.type === 'redeem' ? styles.historyDotRedeem : styles.historyDotEarn]}
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
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  tierRow: {
    marginBottom: SPACING.sm,
  },
  tierBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: COLORS.accent,
    fontSize: FONT.small,
    fontWeight: '700',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  customerName: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: FONT.label,
    marginBottom: SPACING.sm,
  },
  balanceLabel: {
    color: COLORS.accent,
    fontSize: FONT.body,
    fontWeight: '600',
  },
  balanceValue: {
    color: COLORS.textOnPrimary,
    fontSize: FONT.display,
    fontWeight: '800',
    marginVertical: SPACING.xs,
  },
  balanceHint: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: FONT.small,
    marginTop: SPACING.xs,
  },
  tierHint: {
    color: COLORS.primaryLight,
    fontSize: 11,
    marginTop: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  referralCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  referralTitle: {
    fontSize: FONT.label,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  referralText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: SPACING.md,
  },
  referralCodeBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primaryLight,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  referralCodeLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  referralCode: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
    marginTop: SPACING.xs,
  },
  shareButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  shareButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  nextRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  nextRewardIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  nextRewardText: {
    flex: 1,
  },
  nextRewardName: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  nextRewardPoints: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginTop: SPACING.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: FONT.label,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionLabel: {
    fontSize: FONT.label,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT.body,
  },
  historyList: {
    gap: SPACING.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
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
