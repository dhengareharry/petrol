import { useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import GradientBox from '../components/GradientBox';
import Icon from '../components/Icon';
import RewardImage from '../components/RewardImage';
import { REWARDS } from '../data/rewards';
import { useI18n } from '../i18n';
import useLayout from '../utils/useLayout';
import { COLORS, FONT, RADIUS, SHADOW, SPACING } from '../theme';

function confirmAsync(title, message, buttons) {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: buttons.cancel, style: 'cancel', onPress: () => resolve(false) },
      { text: buttons.confirm, onPress: () => resolve(true) },
    ]);
  });
}

function notify(title, message) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export default function CatalogScreen({ customer, pendingRequests, onRequestRedeem }) {
  const [requestingId, setRequestingId] = useState(null);
  const [query, setQuery] = useState('');
  const { rewardColumns } = useLayout();
  const { t, language, rewardName, errorText } = useI18n();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return REWARDS;
    return REWARDS.filter((item) => [item.name, rewardName(item)].some((name) => name.toLowerCase().includes(q)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, language]);

  const pendingRewardIds = useMemo(() => new Set(pendingRequests.map((r) => r.rewardId)), [pendingRequests]);
  // Points already left the balance when a gift was requested. Only requests made before that change (the server says so)
  // still hold points that are not yet taken.
  const pendingPoints = useMemo(() => pendingRequests.reduce((sum, r) => sum + r.points, 0), [pendingRequests]);
  const heldPoints = useMemo(
    () => pendingRequests.filter((r) => !r.pointsDeducted).reduce((sum, r) => sum + r.points, 0),
    [pendingRequests]
  );
  const availablePoints = customer.points - heldPoints;

  async function handleRequest(reward) {
    const confirmed = await confirmAsync(
      t('catalog.confirmTitle'),
      t('catalog.confirmText', { name: rewardName(reward), points: reward.points.toLocaleString() }),
      { cancel: t('common.cancel'), confirm: t('catalog.request') }
    );
    if (!confirmed) return;

    setRequestingId(reward.id);
    try {
      await onRequestRedeem(reward);
      notify(t('catalog.sentTitle'), t('catalog.sentText', { name: rewardName(reward) }));
    } catch (err) {
      notify(t('catalog.failTitle'), errorText(err));
    } finally {
      setRequestingId(null);
    }
  }

  function renderItem({ item }) {
    const alreadyPending = pendingRewardIds.has(item.id);
    const unlocked = availablePoints >= item.points;
    const remaining = item.points - availablePoints;
    const progress = Math.min(1, availablePoints / item.points);

    return (
      <View style={[styles.card, unlocked && styles.cardUnlocked]}>
        <View style={styles.photoWrap}>
          <RewardImage id={item.id} />
          <View style={[styles.photoBadge, unlocked ? styles.photoBadgeOpen : styles.photoBadgeLocked]}>
            <Icon name={unlocked ? 'check' : 'lock'} size={13} color={COLORS.textOnPrimary} strokeWidth={2.6} />
          </View>
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {rewardName(item)}
        </Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>
            {item.points.toLocaleString()} {t('common.pts')}
          </Text>
        </View>
        {alreadyPending ? (
          <View style={styles.pendingPill}>
            <Icon name="clock" size={12} color={COLORS.accentText} />
            <Text style={styles.pendingText}>{t('catalog.awaiting')}</Text>
          </View>
        ) : unlocked ? (
          <Pressable
            style={styles.redeemButton}
            disabled={requestingId === item.id}
            onPress={() => handleRequest(item)}
          >
            <Icon name="gift" size={14} color={COLORS.textOnPrimary} />
            <Text style={styles.redeemButtonText}>
              {requestingId === item.id ? t('catalog.sending') : t('catalog.request')}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.lockedWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(0, progress) * 100}%` }]} />
            </View>
            <Text style={styles.lockedText}>{t('catalog.toGo', { n: remaining.toLocaleString() })}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientBox colors={[COLORS.primary, '#2D56BD']} style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('catalog.title')}</Text>
          <Text style={styles.headerBalance}>
            {pendingPoints > 0 ? t('catalog.pending', { n: pendingPoints.toLocaleString() }) : t('catalog.subtitle')}
          </Text>
        </View>
        <View style={styles.balanceChip}>
          <Text style={styles.balanceChipValue}>{availablePoints.toLocaleString()}</Text>
          <Text style={styles.balanceChipLabel}>{t('catalog.available')}</Text>
        </View>
      </GradientBox>
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.search}
            placeholder={t('catalog.search')}
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        key={rewardColumns} // FlatList needs a fresh instance when the column count changes (e.g. on rotation)
        numColumns={rewardColumns}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('catalog.empty')}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  headerTitle: {
    color: COLORS.textOnPrimary,
    fontSize: FONT.title,
    fontWeight: '800',
  },
  headerBalance: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  balanceChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  balanceChipValue: {
    color: COLORS.textOnPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  balanceChipLabel: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: 10,
  },
  searchWrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    ...SHADOW.card,
  },
  search: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT.body,
    color: COLORS.textPrimary,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  columnWrapper: {
    gap: SPACING.md,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOW.card,
  },
  cardUnlocked: {
    borderColor: COLORS.success,
  },
  photoWrap: {
    width: '100%',
  },
  photoBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadgeOpen: {
    backgroundColor: COLORS.success,
  },
  photoBadgeLocked: {
    backgroundColor: 'rgba(14, 31, 91, 0.65)',
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    minHeight: 34,
    marginTop: SPACING.md,
  },
  pointsBadge: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginTop: SPACING.sm,
  },
  pointsText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  redeemButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  lockedWrap: {
    width: '100%',
    marginTop: SPACING.md,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  lockedText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 1,
    marginTop: SPACING.md,
  },
  pendingText: {
    fontSize: 11,
    color: COLORS.accentText,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: SPACING.xxl,
  },
});
