import { useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import usePagedList from '../../api/usePagedList';
import ClaimPhoto from '../../components/ClaimPhoto';
import DashboardProof from '../../components/DashboardProof';
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
  { key: 'pending', label: 'To hand over' },
  { key: 'all', label: 'All' },
];

// The gift handover photo is camera-only and carries the same date/time/GPS stamp as a fuel proof.
const HANDOVER_LABELS = {
  empty: 'Photograph the customer receiving the gift',
  take: 'Take handover photo',
  retake: 'Retake handover photo',
  cameraDenied: 'Camera permission is required to photograph the handover. Please allow it in settings.',
  locationDenied: 'Location permission is required to record where the gift was handed over. Please allow it and try again.',
  note: 'The photo is camera-only and is stamped with the date, time and GPS location when you confirm.',
};

function statusText(item) {
  if (item.status === 'approved') return `Gift handed over${item.resolvedBy ? ` · by ${item.resolvedBy}` : ''}`;
  const who = item.cancelledByCustomer ? 'Cancelled by customer' : `Cancelled${item.resolvedBy ? ` by ${item.resolvedBy}` : ''}`;
  return item.refunded ? `${who} · points returned` : who;
}

export default function RedeemRequestsScreen({ requests, fetchPage, reloadKey, onIssue, onReject }) {
  const [filter, setFilter] = useState('pending');
  const [busyId, setBusyId] = useState(null);
  // The card that is open for a hand-over or a cancellation: { id, mode: 'issue' | 'cancel' }.
  const [open, setOpen] = useState(null);
  const [proof, setProof] = useState(null);
  const [reason, setReason] = useState('');

  // "To hand over" is the small queue the app already holds; "All" pages through every request on the server.
  const list = usePagedList(
    (page) => (filter === 'all' ? fetchPage(page) : Promise.resolve({ items: [], hasMore: false })),
    [filter, reloadKey]
  );
  const shown = filter === 'pending' ? requests : list.items;

  function openCard(id, mode) {
    setOpen(open?.id === id && open.mode === mode ? null : { id, mode });
    setProof(null);
    setReason('');
  }

  async function handleIssue(request) {
    if (!proof?.photoDataUri || !proof.location) {
      notify('Photo needed', 'Take the handover photo and let the phone read its location before confirming.');
      return;
    }
    setBusyId(request.id);
    try {
      await onIssue(request.id, proof);
      setOpen(null);
      setProof(null);
    } catch (err) {
      notify('Could not hand over', err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(request) {
    setBusyId(request.id);
    try {
      await onReject(request.id, reason.trim());
      setOpen(null);
      setReason('');
    } catch (err) {
      notify('Could not cancel', err.message);
    } finally {
      setBusyId(null);
    }
  }

  function renderItem({ item }) {
    const busy = busyId === item.id;
    const issuing = open?.id === item.id && open.mode === 'issue';
    const cancelling = open?.id === item.id && open.mode === 'cancel';
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
          <>
            <Text style={styles.hint}>
              {item.pointsDeducted
                ? 'Points are already taken from the customer. Hand over the gift at the counter, then upload the photo.'
                : 'Points are taken from the customer when you confirm the handover.'}
            </Text>
            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.actionButton, styles.rejectButton, cancelling && styles.rejectButtonOpen]}
                disabled={busy}
                onPress={() => openCard(item.id, 'cancel')}
              >
                <Text style={styles.rejectButtonText}>{item.pointsDeducted ? 'Cancel & refund' : 'Cancel'}</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.approveButton, issuing && styles.approveButtonOpen]}
                disabled={busy}
                onPress={() => openCard(item.id, 'issue')}
              >
                <Text style={styles.approveButtonText}>Hand over gift</Text>
              </Pressable>
            </View>

            {issuing ? (
              <View style={styles.panel}>
                <DashboardProof enabled labels={HANDOVER_LABELS} value={proof} onChange={setProof} />
                <Pressable
                  style={[styles.confirmButton, (busy || !proof?.photoDataUri || !proof?.location) && styles.disabled]}
                  disabled={busy || !proof?.photoDataUri || !proof?.location}
                  onPress={() => handleIssue(item)}
                >
                  <Text style={styles.confirmButtonText}>{busy ? 'Saving…' : 'Confirm gift handed over'}</Text>
                </Pressable>
              </View>
            ) : null}

            {cancelling ? (
              <View style={styles.panel}>
                <TextInput
                  style={styles.reasonInput}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Reason (optional, shown to the customer)"
                  placeholderTextColor={COLORS.textMuted}
                  maxLength={300}
                />
                <Pressable
                  style={[styles.confirmButton, styles.confirmDanger, busy && styles.disabled]}
                  disabled={busy}
                  onPress={() => handleCancel(item)}
                >
                  <Text style={styles.confirmButtonText}>
                    {busy ? 'Working…' : item.pointsDeducted ? 'Cancel request and return points' : 'Cancel request'}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.statusRow}>
            <Text style={[styles.statusBadge, item.status === 'approved' ? styles.approvedBadge : styles.rejectedBadge]}>
              {statusText(item)}
            </Text>
            {item.status === 'rejected' && item.rejectionReason ? (
              <Text style={styles.reasonLine}>Reason: {item.rejectionReason}</Text>
            ) : null}
            {item.status === 'approved' && item.hasHandoverPhoto ? (
              <ClaimPhoto path={`/redemption-requests/${item.id}/photo`} claimId={item.id} style={styles.handoverPhoto} />
            ) : null}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Redeem Requests</Text>
        <Text style={styles.headerSubtitle}>{requests.filter((r) => r.status === 'pending').length} waiting for hand-over</Text>
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
  hint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
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
  approveButtonOpen: {
    opacity: 0.8,
  },
  approveButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  rejectButton: {
    backgroundColor: '#FEE2E2',
  },
  rejectButtonOpen: {
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  rejectButtonText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 13,
  },
  panel: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  reasonInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT.body,
    color: COLORS.textPrimary,
  },
  confirmButton: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  confirmDanger: {
    backgroundColor: COLORS.danger,
  },
  confirmButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: FONT.body,
  },
  disabled: {
    opacity: 0.5,
  },
  statusRow: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
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
  reasonLine: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  handoverPhoto: {
    width: '100%',
    height: 170,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: SPACING.xxl,
  },
});
