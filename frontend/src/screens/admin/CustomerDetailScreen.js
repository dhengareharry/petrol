import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from '../../components/Icon';
import TierIcon from '../../components/TierIcon';
import { getTierInfo } from '../../utils/tiers';
import { vehicleLabel } from '../../utils/vehicles';
import FuelEntryForm from './FuelEntryForm';
import { COLORS, FONT, RADIUS, SHADOW, SPACING } from '../../theme';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function notify(title, message) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export default function CustomerDetailScreen({ customer, onBack, onCreditPoints, onResetPin }) {
  const { current, next, pointsToNext } = getTierInfo(customer.lifetimePoints);
  const [newPin, setNewPin] = useState('');
  const [resetting, setResetting] = useState(false);

  async function resetPin() {
    if (!/^\d{4}$/.test(newPin)) {
      notify('Invalid PIN', 'Enter a new 4-digit PIN for the customer.');
      return;
    }
    setResetting(true);
    try {
      await onResetPin(customer.phone, newPin);
      setNewPin('');
      notify('PIN reset', `${customer.name} can now log in with the new PIN. Their old sessions were signed out.`);
    } catch (err) {
      notify('Could not reset the PIN', err.message);
    } finally {
      setResetting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.backText}>‹ Customers</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{customer.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <TierIcon tier={current} size={52} />
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{customer.name}</Text>
              <Text style={styles.profileLine}>{customer.phone}</Text>
              {customer.vehicles.map((v) => (
                <View key={v.id} style={styles.vehicleLine}>
                  <Icon name="car" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.profileLine}>{vehicleLabel(v)}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{customer.points.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Points Balance</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{customer.lifetimePoints.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Lifetime Points</Text>
            </View>
          </View>
          <Text style={styles.tierText}>
            {current.label} member{next ? ` · ${pointsToNext.toLocaleString()} pts to ${next.label}` : ' · Top tier'}
          </Text>
          <Text style={styles.joinedText}>Joined {formatDate(customer.joinedDate)}</Text>
        </View>

        {onCreditPoints ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Fuel Filling</Text>
            <FuelEntryForm customer={customer} onCreditPoints={onCreditPoints} />
          </View>
        ) : null}

        {onResetPin ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Reset PIN</Text>
            <Text style={styles.resetHelp}>
              If {customer.name} forgot their PIN, set a new one here and tell it to them in person. It signs them out of every device.
            </Text>
            <View style={styles.resetRow}>
              <View style={styles.resetField}>
                <Icon name="lock" size={16} color={COLORS.textMuted} />
                <TextInput
                  style={styles.resetInput}
                  placeholder="New 4-digit PIN"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  value={newPin}
                  onChangeText={(t) => setNewPin(t.replace(/\D/g, ''))}
                />
              </View>
              <Pressable
                style={[styles.resetButton, (resetting || newPin.length !== 4) && styles.resetButtonDisabled]}
                disabled={resetting || newPin.length !== 4}
                onPress={resetPin}
              >
                <Text style={styles.resetButtonText}>{resetting ? 'Saving…' : 'Reset'}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Activity History</Text>
          {customer.history.length === 0 ? (
            <Text style={styles.emptyText}>No activity yet.</Text>
          ) : (
            customer.history.map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <View
                  style={[
                    styles.historyDot,
                    entry.type === 'redeem' ? styles.historyDotRedeem : styles.historyDotEarn,
                  ]}
                />
                <View style={styles.historyTextWrap}>
                  <Text style={styles.historyLabel}>{entry.label}</Text>
                  <Text style={styles.historyDate}>
                    {formatDate(entry.date)}
                    {entry.by ? ` · by ${entry.by}` : ''}
                  </Text>
                </View>
                <Text style={[styles.historyAmount, entry.type === 'redeem' ? styles.negative : styles.positive]}>
                  {entry.type === 'redeem' ? '-' : '+'}
                  {entry.amount.toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>
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
    gap: SPACING.xs,
  },
  backText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitle: {
    color: COLORS.textOnPrimary,
    fontSize: FONT.title,
    fontWeight: '800',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOW.card,
  },
  vehicleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  resetHelp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: SPACING.md,
  },
  resetRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  resetField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingHorizontal: SPACING.md,
  },
  resetInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT.body,
    color: COLORS.textPrimary,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  resetButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonDisabled: {
    opacity: 0.5,
  },
  resetButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: FONT.body,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: FONT.title,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  profileLine: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  tierText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  joinedText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT.label,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT.body,
    color: COLORS.textSecondary,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
