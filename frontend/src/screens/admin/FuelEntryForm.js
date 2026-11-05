import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DashboardProof from '../../components/DashboardProof';
import Icon from '../../components/Icon';
import RewardImage from '../../components/RewardImage';
import VehicleNumberInput from '../../components/VehicleNumberInput';
import { REWARDS } from '../../data/rewards';
import { useRules } from '../../context/RulesContext';
import { isValidVehicleNumber, vehicleLabel } from '../../utils/vehicles';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';

function notify(title, message) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

const QUICK_RUPEE_AMOUNTS = [500, 1000, 1500, 2000];

export default function FuelEntryForm({ customer, onCreditPoints }) {
  const {
    fuelRatePerLitre: FUEL_RATE_PER_LITRE,
    minFuelAmountRupees: MIN_FUEL_AMOUNT_RUPEES,
    minFuelLitres: MIN_FUEL_LITRES,
  } = useRules();
  const [rupeesText, setRupeesText] = useState('');
  const [litresText, setLitresText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);
  const [typedVehicle, setTypedVehicle] = useState('');
  const [proof, setProof] = useState(null); // { photoDataUri, location }

  const hasVehicles = customer.vehicles.length > 0;
  const vehicleReady = hasVehicles ? Boolean(vehicleId) : isValidVehicleNumber(typedVehicle);
  const amountRupees = Number(rupeesText);
  const amountValid = amountRupees >= MIN_FUEL_AMOUNT_RUPEES;
  const proofReady = Boolean(proof?.photoDataUri && proof?.location);
  const canSubmit = vehicleReady && amountValid && proofReady;

  function handleRupeesChange(text) {
    setRupeesText(text);
    const n = Number(text);
    setLitresText(text && !Number.isNaN(n) ? (n / FUEL_RATE_PER_LITRE).toFixed(2) : '');
  }

  function handleLitresChange(text) {
    setLitresText(text);
    const n = Number(text);
    setRupeesText(text && !Number.isNaN(n) ? String(Math.round(n * FUEL_RATE_PER_LITRE)) : '');
  }

  async function submit() {
    if (!amountValid) {
      notify(
        'Entry too small',
        `Fuel entry must be at least ₹${MIN_FUEL_AMOUNT_RUPEES} (${MIN_FUEL_LITRES} ltr) to qualify for reward points.`
      );
      return;
    }
    if (!vehicleReady) {
      notify('Vehicle needed', hasVehicles ? 'Select the vehicle that was fuelled.' : 'Enter a valid vehicle number.');
      return;
    }
    if (!proofReady) {
      notify('Photo needed', 'Take the dashboard photo (and let the app read the location) before adding the entry.');
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      const oldPoints = customer.points;
      const updated = await onCreditPoints(customer.phone, {
        amountRupees,
        proof: {
          ...(hasVehicles ? { vehicleId } : { vehicleNumber: typedVehicle }),
          photoDataUri: proof.photoDataUri,
          location: proof.location,
        },
      });
      const pointsEarned = Math.round(amountRupees / FUEL_RATE_PER_LITRE);
      const unlocked = REWARDS.filter((r) => r.points > oldPoints && r.points <= updated.points);

      setResult({
        amountRupees,
        litres: pointsEarned,
        newBalance: updated.points,
        unlocked,
      });
      setRupeesText('');
      setLitresText('');
      setProof(null);
      setVehicleId(null);
      setTypedVehicle('');
    } catch (err) {
      notify('Could not add points', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View>
      <Text style={styles.helperText}>
        Rate: ₹{FUEL_RATE_PER_LITRE}/ltr · Minimum ₹{MIN_FUEL_AMOUNT_RUPEES} per entry to qualify for points. Every entry needs the vehicle and a camera photo of the dashboard, which is stamped with the date, time and GPS location.
      </Text>

      <Text style={styles.fieldLabel}>Vehicle fuelled *</Text>
      {hasVehicles ? (
        <View style={styles.chipRow}>
          {customer.vehicles.map((v) => (
            <Pressable
              key={v.id}
              style={[styles.chip, vehicleId === v.id && styles.chipActive]}
              onPress={() => setVehicleId(v.id)}
            >
              <Text style={[styles.chipText, vehicleId === v.id && styles.chipTextActive]}>{vehicleLabel(v)}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <>
          <VehicleNumberInput
            style={styles.input}
            placeholder="Vehicle number (customer has none saved)"
            value={typedVehicle}
            onChangeText={setTypedVehicle}
          />
          <View style={{ height: SPACING.md }} />
        </>
      )}

      <View style={styles.row}>
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Amount (₹) *</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="e.g. 600"
            placeholderTextColor={COLORS.textMuted}
            value={rupeesText}
            onChangeText={handleRupeesChange}
          />
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Litres</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="e.g. 6"
            placeholderTextColor={COLORS.textMuted}
            value={litresText}
            onChangeText={handleLitresChange}
          />
        </View>
      </View>

      <View style={styles.quickRow}>
        {QUICK_RUPEE_AMOUNTS.map((amount) => (
          <Pressable key={amount} style={styles.quickButton} onPress={() => handleRupeesChange(String(amount))}>
            <Text style={styles.quickButtonText}>₹{amount}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.fieldLabel, styles.proofLabel]}>Dashboard photo + location *</Text>
      <DashboardProof
        enabled={vehicleReady && amountValid}
        lockedText="Choose the vehicle and enter the amount to unlock the camera"
        value={proof}
        onChange={setProof}
      />

      <Pressable
        style={[styles.primaryButton, styles.submitButton, (submitting || !canSubmit) && styles.disabled]}
        disabled={submitting || !canSubmit}
        onPress={submit}
      >
        <Text style={styles.primaryButtonText}>{submitting ? 'Adding…' : 'Add Fuel Entry'}</Text>
      </Pressable>

      {result && (
        <View style={styles.resultCard}>
          <View style={styles.resultTitleRow}>
            <Icon name="checkCircle" size={20} color={COLORS.success} />
            <Text style={styles.resultTitle}>Fuel entry recorded</Text>
          </View>
          <Text style={styles.resultLine}>
            ₹{result.amountRupees.toLocaleString()} · {result.litres.toLocaleString()} ltr → +
            {result.litres.toLocaleString()} pts
          </Text>
          <Text style={styles.resultLine}>New balance: {result.newBalance.toLocaleString()} pts</Text>

          {result.unlocked.length > 0 && (
            <View style={styles.unlockedBox}>
              <View style={styles.resultTitleRow}>
                <Icon name="sparkles" size={18} color={COLORS.accent} />
                <Text style={styles.unlockedTitle}>Newly unlocked reward{result.unlocked.length > 1 ? 's' : ''}</Text>
              </View>
              {result.unlocked.map((r) => (
                <View key={r.id} style={styles.unlockedRow}>
                  <RewardImage id={r.id} size={36} radius={9} />
                  <Text style={styles.unlockedItem}>
                    {r.name} ({r.points.toLocaleString()} pts)
                  </Text>
                </View>
              ))}
            </View>
          )}

        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  fieldWrap: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
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
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  disabled: {
    opacity: 0.6,
  },
  quickRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  proofLabel: {
    marginTop: SPACING.xs,
  },
  submitButton: {
    marginTop: SPACING.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.textOnPrimary,
  },
  quickButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  quickButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  resultCard: {
    marginTop: SPACING.lg,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  unlockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  resultTitle: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  resultLine: {
    fontSize: 13,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  unlockedBox: {
    marginTop: SPACING.md,
    backgroundColor: '#FEF3C7',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  },
  unlockedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: SPACING.xs,
  },
  unlockedItem: {
    fontSize: 12,
    color: '#92400E',
  },
});
