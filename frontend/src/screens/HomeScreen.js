import { useRef } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import GradientBox from '../components/GradientBox';
import Icon from '../components/Icon';
import IconTile from '../components/IconTile';
import RewardImage from '../components/RewardImage';
import { REWARDS } from '../data/rewards';
import { getTierInfo } from '../utils/tiers';
import { useRules } from '../context/RulesContext';
import { useI18n } from '../i18n';
import { COLORS, FONT, RADIUS, SHADOW, SPACING } from '../theme';

async function shareReferralCode(message, copiedText) {
  if (Platform.OS === 'web') {
    if (navigator.share) {
      try {
        await navigator.share({ text: message });
      } catch {
        // user cancelled the share sheet, nothing to do
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(message);
      window.alert(copiedText);
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

const SCHEME_CARD_WIDTH = 150;
const SCHEME_CARD_GAP = SPACING.md;

export default function HomeScreen({ customer, onViewRewards }) {
  const { referralBonusPoints: REFERRAL_BONUS_POINTS } = useRules();
  const { t, rewardName, tierLabel, ledgerLabel, formatDate, formatTime } = useI18n();
  const carouselRef = useRef(null);
  const carouselOffset = useRef(0);

  function scrollCarousel(direction) {
    const step = (SCHEME_CARD_WIDTH + SCHEME_CARD_GAP) * 2;
    carouselRef.current?.scrollTo({ x: Math.max(0, carouselOffset.current + direction * step), animated: true });
  }

  const recent = customer.history.slice(0, 8);
  const { current, next, pointsToNext } = getTierInfo(customer.lifetimePoints);
  const nextReward = REWARDS.find((r) => r.points > customer.points);
  const redeemedCount = customer.stats?.redeemedCount ?? customer.history.filter((h) => h.type === 'redeem').length;

  const progress = nextReward ? Math.min(1, customer.points / nextReward.points) : 1;
  const tierProgress = next ? Math.min(1, (customer.lifetimePoints - current.min) / (next.min - current.min)) : 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <GradientBox colors={[COLORS.primaryDark, COLORS.primary, '#2D56BD']} style={styles.balanceCard}>
        <View style={styles.glow} />
        <View style={styles.balanceTop}>
          <View style={styles.balanceLeft}>
            <View style={styles.tierBadge}>
              <Icon name={current.icon} size={14} color={COLORS.accent} />
              <Text style={styles.tierBadgeText}>{t('tier.member', { tier: tierLabel(current) })}</Text>
            </View>
            <Text style={styles.balanceLabel}>{t('home.rewardPoints')}</Text>
            <Text style={styles.balanceValue}>{customer.points.toLocaleString()}</Text>
          </View>
          <View style={styles.balanceFuel}>
            <Icon name="fuel" size={30} color={COLORS.textOnPrimary} />
          </View>
        </View>
        <View style={styles.tierTrack}>
          <View style={[styles.tierFill, { width: `${tierProgress * 100}%` }]} />
        </View>
        <Text style={styles.balanceHint}>
          {next ? t('home.ruleToNext', { n: pointsToNext.toLocaleString(), tier: tierLabel(next) }) : t('home.ruleTop')}
        </Text>
      </GradientBox>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <IconTile name="star" size={38} color={COLORS.accent} background={COLORS.accentSoft} />
          <View>
            <Text style={styles.statValue}>{customer.lifetimePoints.toLocaleString()}</Text>
            <Text style={styles.statLabel}>{t('home.lifetime')}</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <IconTile name="gift" size={38} color={COLORS.success} background={COLORS.successSoft} />
          <View>
            <Text style={styles.statValue}>{redeemedCount}</Text>
            <Text style={styles.statLabel}>{t('home.redeemed')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <IconTile name="fuel" size={44} color={COLORS.accent} background={COLORS.surface} />
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>{t('home.fillTitle')}</Text>
          <Text style={styles.infoSubtitle}>{t('home.fillText')}</Text>
        </View>
      </View>

      <View style={styles.schemeHeader}>
        <Text style={styles.sectionTitle}>{t('home.schemes')}</Text>
        <View style={styles.schemeControls}>
          {Platform.OS === 'web' && (
            <>
              <Pressable style={styles.arrowButton} onPress={() => scrollCarousel(-1)} accessibilityLabel={t('home.scrollLeft')}>
                <Icon name="chevronRight" size={16} color={COLORS.primary} style={styles.flipped} />
              </Pressable>
              <Pressable style={styles.arrowButton} onPress={() => scrollCarousel(1)} accessibilityLabel={t('home.scrollRight')}>
                <Icon name="chevronRight" size={16} color={COLORS.primary} />
              </Pressable>
            </>
          )}
          <Pressable onPress={onViewRewards}>
            <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
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
              <RewardImage id={reward.id} size={120} radius={14} />
              <Text style={styles.schemeName} numberOfLines={2}>
                {rewardName(reward)}
              </Text>
              <Text style={styles.schemePoints}>
                {reward.points.toLocaleString()} {t('common.pts')}
              </Text>
              {unlocked ? (
                <View style={styles.unlockedPill}>
                  <Icon name="check" size={12} color={COLORS.success} strokeWidth={2.6} />
                  <Text style={styles.schemeUnlocked}>{t('home.unlocked')}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.schemeTrack}>
                    <View style={[styles.schemeFill, { width: `${schemeProgress * 100}%` }]} />
                  </View>
                  <Text style={styles.schemeToGo}>{t('home.toGo', { n: (reward.points - customer.points).toLocaleString() })}</Text>
                </>
              )}
            </View>
          );
        })}
      </ScrollView>

      {nextReward ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('home.nextReward')}</Text>
          <View style={styles.nextRewardRow}>
            <RewardImage id={nextReward.id} size={72} radius={16} />
            <View style={styles.nextRewardText}>
              <Text style={styles.nextRewardName}>{rewardName(nextReward)}</Text>
              <Text style={styles.nextRewardPoints}>{t('home.ptsToGo', { n: (nextReward.points - customer.points).toLocaleString() })}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      ) : (
        <View style={[styles.card, styles.allUnlocked]}>
          <Icon name="trophy" size={26} color={COLORS.accent} />
          <Text style={styles.sectionTitle}>{t('home.allUnlocked')}</Text>
        </View>
      )}

      <View style={[styles.card, styles.referralCard]}>
        <View style={styles.referralHead}>
          <IconTile name="users" size={44} color={COLORS.primary} background={COLORS.surface} />
          <Text style={styles.referralTitle}>{t('home.referTitle', { n: REFERRAL_BONUS_POINTS })}</Text>
        </View>
        <Text style={styles.referralText}>{t('home.referText', { n: REFERRAL_BONUS_POINTS })}</Text>
        <View style={styles.referralCodeBox}>
          <Text style={styles.referralCodeLabel}>{t('home.referCode')}</Text>
          <Text style={styles.referralCode}>{customer.phone}</Text>
        </View>
        <Pressable style={styles.shareButton} onPress={() =>
            shareReferralCode(t('home.referMessage', { phone: customer.phone, n: REFERRAL_BONUS_POINTS }), t('home.referCopied'))
          }>
          <Icon name="share" size={16} color={COLORS.textOnPrimary} />
          <Text style={styles.shareButtonText}>{t('home.referShare')}</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>{t('home.recent')}</Text>
      {recent.length === 0 ? (
        <Text style={styles.emptyText}>{t('home.noActivity')}</Text>
      ) : (
        <View style={styles.historyList}>
          {recent.map((entry) => {
            const redeem = entry.type === 'redeem';
            return (
              <View key={entry.id} style={styles.historyRow}>
                <View style={[styles.historyIcon, redeem ? styles.historyIconRedeem : styles.historyIconEarn]}>
                  <Icon name={redeem ? 'arrowDown' : 'arrowUp'} size={16} color={redeem ? COLORS.danger : COLORS.success} strokeWidth={2.4} />
                </View>
                <View style={styles.historyTextWrap}>
                  <Text style={styles.historyLabel}>{ledgerLabel(entry.label)}</Text>
                  <Text style={styles.historyDate}>
                    {formatDate(entry.date)} · {formatTime(entry.date)}
                  </Text>
                </View>
                <Text style={[styles.historyAmount, redeem ? styles.negative : styles.positive]}>
                  {redeem ? '-' : '+'}
                  {entry.amount.toLocaleString()}
                </Text>
              </View>
            );
          })}
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
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOW.raised,
  },
  glow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    top: -70,
    right: -50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  balanceTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  balanceLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.pill,
    marginBottom: SPACING.lg,
  },
  tierBadgeText: {
    color: COLORS.textOnPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  balanceLabel: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  balanceValue: {
    color: COLORS.textOnPrimary,
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 48,
  },
  balanceFuel: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: SPACING.lg,
  },
  tierFill: {
    height: 6,
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  balanceHint: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: 11,
    marginTop: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOW.card,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#FBD9BC',
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONT.label,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  infoSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipped: {
    transform: [{ scaleX: -1 }],
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  carousel: {
    marginHorizontal: -SPACING.lg,
    marginBottom: SPACING.xl,
    flexGrow: 0,
  },
  carouselContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    gap: SCHEME_CARD_GAP,
  },
  schemeCard: {
    width: SCHEME_CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOW.card,
  },
  schemeCardUnlocked: {
    borderColor: COLORS.success,
  },
  schemeName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    minHeight: 32,
    marginTop: SPACING.sm,
  },
  schemePoints: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  unlockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.successSoft,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    marginTop: SPACING.sm,
  },
  schemeUnlocked: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
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
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  schemeToGo: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOW.card,
  },
  allUnlocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  referralCard: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#CFDBF7',
    boxShadow: 'none',
  },
  referralHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  referralTitle: {
    flex: 1,
    fontSize: FONT.label,
    fontWeight: '800',
    color: COLORS.textPrimary,
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
    borderWidth: 1.5,
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
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
    marginTop: SPACING.xs,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
  },
  shareButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  nextRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  nextRewardText: {
    flex: 1,
  },
  nextRewardName: {
    fontSize: FONT.label,
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
    marginTop: SPACING.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: FONT.label,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sectionLabel: {
    fontSize: FONT.label,
    fontWeight: '800',
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
    ...SHADOW.card,
  },
  historyIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyIconEarn: {
    backgroundColor: COLORS.successSoft,
  },
  historyIconRedeem: {
    backgroundColor: COLORS.dangerSoft,
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
    fontWeight: '800',
  },
  positive: {
    color: COLORS.success,
  },
  negative: {
    color: COLORS.danger,
  },
});
