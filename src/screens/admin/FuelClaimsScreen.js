import { useMemo, useState } from 'react';
import { Alert, FlatList, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ClaimPhoto from '../../components/ClaimPhoto';
import { FUEL_RATE_PER_LITRE, MIN_FUEL_AMOUNT_RUPEES } from '../../storage/customerStore';
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

function ClaimCard({ claim, onApprove, onReject }) {
  const [amount, setAmount] = useState(String(claim.claimedAmountRupees));
  const [busy, setBusy] = useState(false);
  const { latitude, longitude, accuracy } = claim.location;
  const approvedPoints = Math.round(Number(amount) / FUEL_RATE_PER_LITRE);

  async function run(action) {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      notify('Could not update claim', err.message);
    } finally {
      setBusy(false);
    }
  }

  function openMap() {
    Linking.openURL(`https://www.google.com/maps?q=${latitude},${longitude}`);
  }

  return (
    <View style={styles.card}>
      <ClaimPhoto claimId={claim.id} style={styles.photo} resizeMode="contain" />

      <Text style={styles.customerName}>{claim.customerName}</Text>
      <Text style={styles.customerLine}>
        {claim.customerPhone}
        {claim.vehicleModel ? ` · ${claim.vehicleModel}` : ''}
        {claim.vehicleNumber ? ` · ${claim.vehicleNumber}` : ''}
      </Text>
      <Text style={styles.metaLine}>Submitted {formatDate(claim.submittedDate)}</Text>

      <Pressable onPress={openMap}>
        <Text style={styles.locationLink}>
          📍 {latitude.toFixed(5)}, {longitude.toFixed(5)}
          {accuracy ? ` (±${Math.round(accuracy)} m)` : ''} · Open in Maps
        </Text>
      </Pressable>

      {claim.status === 'pending' ? (
        <>
          <Text style={styles.fieldLabel}>Amount to approve (₹) — customer claimed ₹{claim.claimedAmountRupees}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          <Text style={styles.hint}>
            {Number(amount) >= MIN_FUEL_AMOUNT_RUPEES
              ? `Credits ${approvedPoints} points at ₹${FUEL_RATE_PER_LITRE}/ltr`
              : `Minimum ₹${MIN_FUEL_AMOUNT_RUPEES} to qualify`}
          </Text>
          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.actionButton, styles.rejectButton, busy && styles.disabled]}
              disabled={busy}
              onPress={() => run(() => onReject(claim.id))}
            >
              <Text style={styles.rejectText}>Reject</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.approveButton, busy && styles.disabled]}
              disabled={busy}
              onPress={() => run(() => onApprove(claim.id, Number(amount)))}
            >
              <Text style={styles.approveText}>{busy ? 'Working…' : 'Approve'}</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Text style={[styles.statusBadge, claim.status === 'approved' ? styles.approvedBadge : styles.rejectedBadge]}>
          {claim.status === 'approved'
            ? `Approved · ₹${claim.approvedAmountRupees} · +${claim.pointsAwarded} pts`
            : 'Rejected'}
          {claim.resolvedBy ? ` · by ${claim.resolvedBy}` : ''}
        </Text>
      )}
    </View>
  );
}

export default function FuelClaimsScreen({ claims, onApprove, onReject }) {
  const [filter, setFilter] = useState('pending');

  const filtered = useMemo(
    () => (filter === 'pending' ? claims.filter((c) => c.status === 'pending') : claims),
    [claims, filter]
  );
  const pendingCount = claims.filter((c) => c.status === 'pending').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fuel Proofs</Text>
        <Text style={styles.headerSubtitle}>{pendingCount} awaiting review</Text>
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
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ClaimCard claim={item} onApprove={onApprove} onReject={onReject} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        ListEmptyComponent={<Text style={styles.emptyText}>Nothing here.</Text>}
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
  photo: {
    width: '100%',
    height: 220,
    marginBottom: SPACING.md,
  },
  customerName: {
    fontSize: FONT.label,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  customerLine: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  metaLine: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  locationLink: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  fieldLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT.label,
    color: COLORS.textPrimary,
  },
  hint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: COLORS.success,
  },
  approveText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  rejectButton: {
    backgroundColor: '#FEE2E2',
  },
  rejectText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 13,
  },
  disabled: {
    opacity: 0.6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: SPACING.md,
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
