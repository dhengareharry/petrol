import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ClaimPhoto from '../components/ClaimPhoto';
import RewardImage from '../components/RewardImage';
import ScreenHeader from '../components/ScreenHeader';
import { useI18n } from '../i18n';
import { COLORS, FONT, RADIUS, SHADOW, SPACING } from '../theme';

const STATUS_STYLE_KEY = {
  pending: 'statusPending',
  approved: 'statusApproved',
  rejected: 'statusRejected',
};

// How far back the history reaches. Gifts waiting to be collected always show, whatever their age.
const PERIODS = [30, 45, 90];
const DAY_MS = 24 * 60 * 60 * 1000;

function confirmAsync(title, message, buttons) {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: buttons.cancel, style: 'cancel', onPress: () => resolve(false) },
      { text: buttons.confirm, style: 'destructive', onPress: () => resolve(true) },
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

export default function RedemptionsScreen({ customer, requests, claims = [], onCancel }) {
  const { t, rewardName, formatDate, errorText } = useI18n();
  const [period, setPeriod] = useState(30);
  const [cancellingId, setCancellingId] = useState(null);
  const myRequests = requests.filter((r) => r.customerPhone === customer.phone);
  const since = Date.now() - period * DAY_MS;

  // Built from the customer's redemption requests (their points ledger is paged, so it isn't the full story).
  const allItems = myRequests.map((r) => ({
    id: r.id,
    rewardId: r.rewardId,
    rewardName: r.rewardName,
    points: r.points,
    status: r.status,
    refunded: r.refunded,
    cancelledByCustomer: r.cancelledByCustomer,
    rejectionReason: r.rejectionReason,
    hasHandoverPhoto: r.hasHandoverPhoto,
    // The date that matters: when the gift was handed over / the request was cancelled, else when it was asked for.
    date: r.status !== 'pending' && r.resolvedDate ? r.resolvedDate : r.requestedDate,
  }));
  const redeemedCount = allItems.filter((item) => item.status === 'approved').length;
  const items = allItems
    .filter((item) => item.status === 'pending' || new Date(item.date).getTime() >= since)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Fill-ups the cashier recorded (with a dashboard photo and location) or that were approved after a review.
  const fillUps = claims.filter(
    (c) => c.customerPhone === customer.phone && c.status !== 'pending' && new Date(c.submittedDate).getTime() >= since
  );

  async function handleCancel(item) {
    const confirmed = await confirmAsync(
      t('history.cancelTitle'),
      t('history.cancelText', { name: rewardName({ id: item.rewardId, name: item.rewardName }), points: item.points.toLocaleString() }),
      { cancel: t('history.keep'), confirm: t('history.cancelConfirm') }
    );
    if (!confirmed) return;
    setCancellingId(item.id);
    try {
      await onCancel(item.id);
      notify(t('history.cancelledTitle'), t('history.cancelledText', { points: item.points.toLocaleString() }));
    } catch (err) {
      notify(t('history.cancelFailTitle'), errorText(err));
    } finally {
      setCancellingId(null);
    }
  }

  function dateLine(item) {
    if (item.status === 'approved') return t('history.handedOn', { date: formatDate(item.date) });
    if (item.status === 'rejected') return t('history.cancelledOn', { date: formatDate(item.date) });
    return t('history.requestedOn', { date: formatDate(item.date) });
  }

  function statusLabel(item) {
    if (item.status === 'rejected') return item.refunded ? t('history.status.rejected') : t('history.status.rejectedNoRefund');
    return t(`history.status.${item.status}`);
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('history.title')} subtitle={t('history.subtitle', { count: redeemedCount })} />

      <View style={styles.periodRow}>
        {PERIODS.map((days) => (
          <Pressable
            key={days}
            style={[styles.periodChip, period === days && styles.periodChipActive]}
            onPress={() => setPeriod(days)}
            accessibilityRole="button"
            accessibilityState={{ selected: period === days }}
          >
            <Text style={[styles.periodText, period === days && styles.periodTextActive]}>{t('history.lastDays', { n: days })}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>{allItems.length === 0 ? t('history.empty') : t('history.emptyPeriod', { n: period })}</Text>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardRow}>
                <RewardImage id={item.rewardId} size={56} />
                <View style={styles.cardText}>
                  <Text style={styles.itemName}>{rewardName({ id: item.rewardId, name: item.rewardName })}</Text>
                  <Text style={styles.itemDate}>{dateLine(item)}</Text>
                  {item.status === 'rejected' && item.rejectionReason ? (
                    <Text style={styles.reason}>{t('history.reason', { reason: item.rejectionReason })}</Text>
                  ) : null}
                </View>
                <View style={styles.rightCol}>
                  {item.status === 'rejected' ? (
                    item.refunded ? (
                      <Text style={styles.earned}>
                        +{item.points.toLocaleString()} {t('common.pts')}
                      </Text>
                    ) : null
                  ) : (
                    <Text style={styles.itemPoints}>
                      -{item.points.toLocaleString()} {t('common.pts')}
                    </Text>
                  )}
                  <Text style={[styles.statusBadge, styles[STATUS_STYLE_KEY[item.status]]]}>{statusLabel(item)}</Text>
                </View>
              </View>

              {item.status === 'approved' && item.hasHandoverPhoto ? (
                <View style={styles.handover}>
                  <Text style={styles.handoverLabel}>{t('history.handoverPhoto')}</Text>
                  <ClaimPhoto path={`/redemption-requests/${item.id}/photo`} claimId={item.id} style={styles.handoverPhoto} />
                </View>
              ) : null}

              {item.status === 'pending' ? (
                <>
                  <Text style={styles.pickupNote}>{t('history.pickupNote')}</Text>
                  <Pressable
                    style={[styles.cancelButton, cancellingId === item.id && styles.disabled]}
                    disabled={cancellingId === item.id}
                    onPress={() => handleCancel(item)}
                  >
                    <Text style={styles.cancelButtonText}>
                      {cancellingId === item.id ? t('history.cancelling') : t('history.cancel')}
                    </Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>{t('history.fillups')}</Text>
        {fillUps.length === 0 ? (
          <Text style={styles.emptyText}>{t('history.noFillups')}</Text>
        ) : (
          fillUps.map((claim) => (
            <View key={claim.id} style={styles.card}>
              <View style={styles.cardRow}>
                <ClaimPhoto claimId={claim.id} style={styles.thumb} />
                <View style={styles.cardText}>
                  <Text style={styles.itemName}>₹{claim.claimedAmountRupees.toLocaleString()}</Text>
                  <Text style={styles.itemDate}>
                    {formatDate(claim.submittedDate)}
                    {claim.vehicleNumber ? ` · ${claim.vehicleNumber}` : ''}
                  </Text>
                  {claim.status === 'rejected' && claim.rejectionReason ? (
                    <Text style={styles.reason}>{t('history.reason', { reason: claim.rejectionReason })}</Text>
                  ) : null}
                </View>
                <View style={styles.rightCol}>
                  <Text style={claim.status === 'approved' ? styles.earned : styles.itemPoints}>
                    {claim.status === 'approved' ? t('history.earned', { n: claim.pointsAwarded }) : t('history.status.rejected')}
                  </Text>
                  {claim.resolvedBy ? <Text style={styles.itemDate}>{t('history.by', { name: claim.resolvedBy })}</Text> : null}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  periodRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  periodChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  periodChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  periodTextActive: {
    color: COLORS.textOnPrimary,
  },
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
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOW.card,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
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
  handover: {
    marginTop: SPACING.md,
  },
  handoverLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  handoverPhoto: {
    width: '100%',
    height: 160,
  },
  pickupNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  cancelButton: {
    marginTop: SPACING.sm,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.dangerSoft,
  },
  cancelButtonText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 13,
  },
  disabled: {
    opacity: 0.5,
  },
});
