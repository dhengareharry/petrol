import { useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { REWARDS } from '../data/rewards';
import { COLORS, FONT, RADIUS, SPACING } from '../theme';

function confirmAsync(title, message) {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Request', onPress: () => resolve(true) },
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return REWARDS;
    return REWARDS.filter((item) => item.name.toLowerCase().includes(q));
  }, [query]);

  const pendingRewardIds = useMemo(() => new Set(pendingRequests.map((r) => r.rewardId)), [pendingRequests]);
  const pendingPoints = useMemo(() => pendingRequests.reduce((sum, r) => sum + r.points, 0), [pendingRequests]);
  const availablePoints = customer.points - pendingPoints;

  async function handleRequest(reward) {
    const confirmed = await confirmAsync(
      'Request Redemption',
      `Request "${reward.name}" for ${reward.points.toLocaleString()} points? An admin will need to approve it.`
    );
    if (!confirmed) return;

    setRequestingId(reward.id);
    try {
      await onRequestRedeem(reward);
      notify('Request sent', `Your request for ${reward.name} is pending admin approval.`);
    } catch (err) {
      notify('Unable to request', err.message);
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
        <Text style={styles.icon}>{item.icon}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{item.points.toLocaleString()} pts</Text>
        </View>
        {alreadyPending ? (
          <Text style={styles.pendingText}>Requested · Awaiting approval</Text>
        ) : unlocked ? (
          <Pressable
            style={styles.redeemButton}
            disabled={requestingId === item.id}
            onPress={() => handleRequest(item)}
          >
            <Text style={styles.redeemButtonText}>
              {requestingId === item.id ? 'Sending…' : 'Request'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.lockedWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(0, progress) * 100}%` }]} />
            </View>
            <Text style={styles.lockedText}>{remaining.toLocaleString()} pts to go</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rewards Catalog</Text>
        <Text style={styles.headerBalance}>
          Available: {availablePoints.toLocaleString()} pts
          {pendingPoints > 0 ? ` (${pendingPoints.toLocaleString()} pts pending approval)` : ''}
        </Text>
      </View>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search rewards"
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={<Text style={styles.emptyText}>No rewards match your search.</Text>}
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
  headerBalance: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  searchWrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  search: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT.body,
    color: COLORS.textPrimary,
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
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
  },
  cardUnlocked: {
    borderColor: COLORS.accent,
  },
  icon: {
    fontSize: 36,
    marginBottom: SPACING.sm,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    minHeight: 34,
  },
  pointsBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginTop: SPACING.sm,
  },
  pointsText: {
    color: COLORS.textOnPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  redeemButton: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.sm,
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
    backgroundColor: COLORS.primaryLight,
    borderRadius: 3,
  },
  lockedText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  pendingText: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '700',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: SPACING.xxl,
  },
});
