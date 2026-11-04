import { useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import usePagedList from '../../api/usePagedList';
import RewardImage from '../../components/RewardImage';
import ListFooter from '../../components/ListFooter';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';

function notify(title, message) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const FILTERS = [
  { key: 'pending', label: 'Pending' },
  { key: 'all', label: 'All' },
];

export default function RedeemRequestsScreen({ requests, fetchPage, reloadKey, onApprove, onReject }) {
  const [filter, setFilter] = useState('pending');
  const [busyId, setBusyId] = useState(null);

  // "Pending" is the small queue the app already holds; "All" pages through every request on the server.
  const list = usePagedList(
    (page) => (filter === 'all' ? fetchPage(page) : Promise.resolve({ items: [], hasMore: false })),
    [filter, reloadKey]
  );
  const shown = filter === 'pending' ? requests : list.items;

  async function handleApprove(request) {
    setBusyId(request.id);
    try {
      await onApprove(request.id);
    } catch (err) {
      notify('Could not approve', err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(request) {
    setBusyId(request.id);
    try {
      await onReject(request.id);
    } catch (err) {
      notify('Could not reject', err.message);
    } finally {
      setBusyId(null);
    }
  }

  function renderItem({ item }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <RewardImage id={item.rewardId} size={56} />
          <View style={styles.cardText}>
            <Text style={styles.rewardName}>{item.rewardName}</Text>
            <Text style={styles.customerLine}>
              {item.customerName} · {item.customerPhone}
            </Text>
            <Text style={styles.dateLine}>Requested {formatDate(item.requestedDate)}</Text>
          </View>
          <Text style={styles.points}>{item.points.toLocaleString()} pts</Text>
        </View>

        {item.status === 'pending' ? (
          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.actionButton, styles.rejectButton]}
              disabled={busyId === item.id}
              onPress={() => handleReject(item)}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.approveButton]}
              disabled={busyId === item.id}
              onPress={() => handleApprove(item)}
            >
              <Text style={styles.approveButtonText}>{busyId === item.id ? 'Working…' : 'Approve'}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.statusRow}>
            <Text style={[styles.statusBadge, item.status === 'approved' ? styles.approvedBadge : styles.rejectedBadge]}>
              {item.status === 'approved' ? 'Approved' : 'Rejected'}
              {item.resolvedBy ? ` · by ${item.resolvedBy}` : ''}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Redeem Requests</Text>
        <Text style={styles.headerSubtitle}>{requests.filter((r) => r.status === 'pending').length} awaiting review</Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.filterButton, filter === f.key && styles.filterButtonActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={shown}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        ListEmptyComponent={filter === 'all' && list.loading ? null : <Text style={styles.emptyText}>Nothing here.</Text>}
        onEndReached={filter === 'all' ? list.loadMore : undefined}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          filter === 'all' ? (
            <ListFooter
              loading={list.loading}
              loadingMore={list.loadingMore}
              hasMore={list.hasMore}
              error={list.error}
              hasItems={list.items.length > 0}
              onLoadMore={list.loadMore}
            />
          ) : null
        }
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
  headerSubtitle: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.textOnPrimary,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  icon: {
    fontSize: 30,
  },
  cardText: {
    flex: 1,
  },
  rewardName: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  customerLine: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  dateLine: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  points: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: COLORS.success,
  },
  approveButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  rejectButton: {
    backgroundColor: '#FEE2E2',
  },
  rejectButtonText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 13,
  },
  statusRow: {
    marginTop: SPACING.md,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    overflow: 'hidden',
  },
  approvedBadge: {
    backgroundColor: '#DCFCE7',
    color: COLORS.success,
  },
  rejectedBadge: {
    backgroundColor: '#FEE2E2',
    color: COLORS.danger,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: SPACING.xxl,
  },
});
