import { useRef } from 'react';
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

const SCHEME_CARD_WIDTH = 140;
const SCHEME_CARD_GAP = SPACING.md;

export default function HomeScreen({ customer, onUploadFuel, onViewRewards }) {
  const carouselRef = useRef(null);
  const carouselOffset = useRef(0);

  function scrollCarousel(direction) {
    const step = (SCHEME_CARD_WIDTH + SCHEME_CARD_GAP) * 2;
    carouselRef.current?.scrollTo({ x: Math.max(0, carouselOffset.current + direction * step), animated: true });
  }

  const recent = customer.history.slice(0, 8);
  const { current, next, pointsToNext } = getTierInfo(customer.lifetimePoints);
  const nextReward = REWARDS.find((r) => r.points > customer.points);
  const redeemedCount = customer.history.filter((h) => h.type === 'redeem').length;

  const progress = nextReward ? Math.min(1, customer.points / nextReward.points) : 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.balanceCard}>
        <View style={styles.balanceTop}>
          <View style={styles.balanceLeft}>
            <Text style={styles.customerName} numberOfLines={1}>
              {customer.name}
            </Text>
            <Text style={styles.tierBadge}>
              {current.icon} {current.label} Member
            </Text>
          </View>
          <View style={styles.balanceRight}>
            <Text style={styles.balanceValue}>{customer.points.toLocaleString()}</Text>
            <Text style={styles.balanceLabel}>Reward points</Text>
          </View>
        </View>
        <Text style={styles.balanceHint}>
          1 point = 1 litre{next ? ` · ${pointsToNext.toLocaleString()} lifetime pts to ${next.label}` : ''}
        </Text>
      </View>

      <View style={styles.schemeHeader}>
        <Text style={styles.sectionTitle}>Reward Schemes</Text>
        <View style={styles.schemeControls}>
          {Platform.OS === 'web' && (
            <>
              <Pressable style={styles.arrowButton} onPress={() => scrollCarousel(-1)}>
                <Text style={styles.arrowText}>‹</Text>
              </Pressable>
              <Pressable style={styles.arrowButton} onPress={() => scrollCarousel(1)}>
                <Text style={styles.arrowText}>›</Text>
              </Pressable>
            </>
          )}
          <Pressable onPress={onViewRewards}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView
        ref={carouselRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCHEME_CARD_WIDTH + SCHEME_CARD_GAP}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={(e) => {
          carouselOffset.current = e.nativeEvent.contentOffset.x;
        }}
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}
      >
        {REWARDS.map((reward) => {
          const unlocked = customer.points >= reward.points;
          const schemeProgress = Math.min(1, customer.points / reward.points);
          return (
            <View key={reward.id} style={[styles.schemeCard, unlocked && styles.schemeCardUnlocked]}>
              <Text style={styles.schemeIcon}>{reward.icon}</Text>
              <Text style={styles.schemeName} numberOfLines={2}>
                {reward.name}
              </Text>
              <Text style={styles.schemePoints}>{reward.points.toLocaleString()} pts</Text>
              {unlocked ? (
                <Text style={styles.schemeUnlocked}>✓ Unlocked</Text>
              ) : (
                <>
                  <View style={styles.schemeTrack}>
                    <View style={[styles.schemeFill, { width: `${schemeProgress * 100}%` }]} />
                  </View>
                  <Text style={styles.schemeToGo}>{(reward.points - customer.points).toLocaleString()} to go</Text>
                </>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Pressable style={styles.uploadCard} onPress={onUploadFuel}>
        <Text style={styles.uploadIcon}>📸</Text>
        <View style={styles.uploadText}>
          <Text style={styles.uploadTitle}>Just filled fuel?</Text>
          <Text style={styles.uploadSubtitle}>Upload a dashboard photo to earn your points</Text>
        </View>
        <Text style={styles.uploadArrow}>›</Text>
      </Pressable>

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
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  balanceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  balanceLeft: {
    flex: 1,
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  balanceRight: {
    alignItems: 'flex-end',
  },
  customerName: {
    color: COLORS.textOnPrimary,
    fontSize: FONT.label,
    fontWeight: '700',
  },
  tierBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 10,
    overflow: 'hidden',
  },
  balanceValue: {
    color: COLORS.textOnPrimary,
    fontSize: 32,
    fontWeight: '800',
  },
  balanceLabel: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  balanceHint: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: 11,
    marginTop: SPACING.md,
  },
  schemeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  schemeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  arrowButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    lineHeight: 18,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  carousel: {
    marginHorizontal: -SPACING.lg,
    marginBottom: SPACING.lg,
    flexGrow: 0,
  },
  carouselContent: {
    paddingHorizontal: SPACING.lg,
    gap: SCHEME_CARD_GAP,
  },
  schemeCard: {
    width: SCHEME_CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
  },
  schemeCardUnlocked: {
    borderColor: COLORS.accent,
  },
  schemeIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  schemeName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    minHeight: 30,
  },
  schemePoints: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  schemeUnlocked: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
    marginTop: SPACING.sm,
  },
  schemeTrack: {
    width: '100%',
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  schemeFill: {
    height: 5,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 3,
  },
  schemeToGo: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  uploadIcon: {
    fontSize: 28,
  },
  uploadText: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: FONT.label,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  uploadArrow: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
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
