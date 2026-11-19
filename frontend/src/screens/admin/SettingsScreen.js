import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import Icon from '../../components/Icon';
import { useConfirm } from '../../context/ConfirmContext';
import { useRules } from '../../context/RulesContext';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';

// The pump's position has to be read accurately: every photo is judged against it.
const MAX_PUMP_FIX_ACCURACY_M = 75;

const FIELDS = [
  {
    key: 'fuelRatePerLitre',
    label: 'Fuel rate (₹ per litre)',
    hint: 'Today\'s price on the pump board, with paise if it has them (for example 99.38 or 112.97). It converts rupees to litres. 1 point is earned per litre, so a ₹1,000 fill-up at ₹99.38/ltr is 10.06 litres and earns 10 points.',
    min: 1,
    max: 10000,
    decimal: true,
  },
  {
    key: 'minFuelAmountRupees',
    label: 'Minimum fill-up (₹)',
    hint: 'Fuel entries and fuel proofs below this amount do not earn points.',
    min: 1,
    max: 100000,
  },
  {
    key: 'geofenceMeters',
    label: 'Photo distance limit (metres)',
    hint: 'Fuel and gift-handover photos are only accepted when the phone is within this distance of the pump (set the pump location below). 200 is a good start.',
    min: 50,
    max: 2000,
  },
  {
    key: 'referralBonusPoints',
    label: 'Referral bonus (points)',
    hint: 'Paid to both the customer who shares their code and the friend who signs up with it. 0 turns it off.',
    min: 0,
    max: 100000,
  },
];

/** Admin-only: the program rules that the server uses for every fuel entry, proof and sign-up. */
export default function SettingsScreen({ onBack }) {
  const rules = useRules();
  const [values, setValues] = useState(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, String(rules[f.key])]))
  );
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const confirm = useConfirm();
  const [pumpMessage, setPumpMessage] = useState(null);
  const [locating, setLocating] = useState(false);
  const hasPump = rules.pumpLatitude != null && rules.pumpLongitude != null;

  // Read where the admin is standing and make it the pump's location.
  async function setPumpHere() {
    if (locating) return;
    setPumpMessage(null);
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setPumpMessage({ ok: false, text: 'Location permission is needed to read where you are. Please allow it and try again.' });
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude, accuracy } = position.coords;
      if (accuracy != null && accuracy > MAX_PUMP_FIX_ACCURACY_M) {
        setPumpMessage({
          ok: false,
          text: `The GPS signal is weak (accurate to only ${Math.round(accuracy)} m). Go outdoors, wait a few seconds and try again.`,
        });
        return;
      }
      const yes = await confirm({
        title: 'Set the pump location here?',
        message: `Photos will only be accepted within ${rules.geofenceMeters} m of this spot (${latitude.toFixed(5)}, ${longitude.toFixed(5)}). Make sure you are standing at the pump.`,
        confirmLabel: 'Set location',
        cancelLabel: 'Cancel',
        icon: 'mapPin',
      });
      if (!yes) return;
      await rules.save({ pumpLatitude: Number(latitude.toFixed(6)), pumpLongitude: Number(longitude.toFixed(6)) });
      setPumpMessage({ ok: true, text: 'Pump location saved. Photos are now checked against it.' });
    } catch (err) {
      setPumpMessage({ ok: false, text: err?.message || 'Could not read the location. Check that location services are on.' });
    } finally {
      setLocating(false);
    }
  }

  async function clearPump() {
    const yes = await confirm({
      title: 'Turn off the distance check?',
      message: 'Photos will be accepted from anywhere until you set the pump location again.',
      confirmLabel: 'Turn off',
      cancelLabel: 'Keep it on',
      destructive: true,
      icon: 'mapPinOff',
    });
    if (!yes) return;
    setPumpMessage(null);
    try {
      await rules.save({ pumpLatitude: null, pumpLongitude: null });
      setPumpMessage({ ok: true, text: 'The distance check is off.' });
    } catch (err) {
      setPumpMessage({ ok: false, text: err.message });
    }
  }

  // Compared as numbers, so "99.380" or "100.0" typed over the same value is not a change.
  const changed = FIELDS.some((f) => Number(values[f.key].trim()) !== Number(rules[f.key]) || values[f.key].trim() === '');

  async function save() {
    const changes = {};
    for (const field of FIELDS) {
      const text = values[field.key].trim();
      const shape = field.decimal ? /^\d+(\.\d{1,2})?$/ : /^\d+$/;
      if (!shape.test(text) || Number(text) < field.min || Number(text) > field.max) {
        setMessage({
          ok: false,
          text: field.decimal
            ? `${field.label}: enter an amount from ${field.min} to ${field.max.toLocaleString('en-IN')} with at most 2 decimals, like 99.38.`
            : `${field.label}: enter a whole number from ${field.min} to ${field.max.toLocaleString('en-IN')}.`,
        });
        return;
      }
      changes[field.key] = Number(text);
    }
    // Points are rupees / rate rounded, so the smallest allowed fill-up has to be worth at least half the rate to earn one.
    const floor = Math.ceil(changes.fuelRatePerLitre / 2);
    if (changes.minFuelAmountRupees < floor) {
      setMessage({ ok: false, text: `The minimum fill-up must be at least ₹${floor} (half the fuel rate), or it would earn no points.` });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await rules.save(changes);
      setMessage({ ok: true, text: 'Saved. The new rules apply to every entry from now on.' });
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Text style={styles.backText}>‹ Dashboard</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Program Settings</Text>
        <Text style={styles.headerSubtitle}>Rules used for points and referrals</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {FIELDS.map((field) => (
          <View key={field.key} style={styles.card}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              keyboardType={field.decimal ? 'decimal-pad' : 'number-pad'}
              maxLength={field.decimal ? 8 : 6}
              value={values[field.key]}
              onChangeText={(raw) => {
                // Digits only; the rate may also have one decimal point and at most 2 digits after it.
                const text = field.decimal
                  ? raw.replace(/,/g, '.').replace(/[^0-9.]/g, '').replace(/^(\d*\.?\d{0,2}).*$/, '$1')
                  : raw.replace(/\D/g, '');
                setValues((prev) => ({ ...prev, [field.key]: text }));
                setMessage(null);
              }}
            />
            <Text style={styles.hint}>{field.hint}</Text>
          </View>
        ))}

        <View style={styles.card}>
          <Text style={styles.label}>Pump location</Text>
          {hasPump ? (
            <View style={styles.pumpRow}>
              <Icon name="mapPin" size={16} color={COLORS.success} />
              <Text style={styles.pumpValue}>
                {rules.pumpLatitude.toFixed(5)}, {rules.pumpLongitude.toFixed(5)}
              </Text>
            </View>
          ) : (
            <View style={styles.pumpRow}>
              <Icon name="mapPinOff" size={16} color={COLORS.danger} />
              <Text style={styles.pumpUnset}>Not set: photos are accepted from anywhere.</Text>
            </View>
          )}
          <Text style={styles.hint}>
            Stand at the pump, outdoors, and tap the button. Fuel and gift-handover photos are then only accepted within{' '}
            {rules.geofenceMeters} m of this spot. Use the same spot you would want staff to stand near.
          </Text>
          {pumpMessage ? (
            <Text style={[styles.message, pumpMessage.ok ? styles.messageOk : styles.messageError]}>{pumpMessage.text}</Text>
          ) : null}
          <Pressable style={[styles.pumpButton, locating && styles.disabled]} disabled={locating} onPress={setPumpHere}>
            <Text style={styles.pumpButtonText}>
              {locating ? 'Reading location…' : hasPump ? 'Update to my current location' : 'Set to my current location'}
            </Text>
          </Pressable>
          {hasPump ? (
            <View style={styles.pumpLinks}>
              <Pressable
                hitSlop={8}
                onPress={() => Linking.openURL(`https://www.google.com/maps?q=${rules.pumpLatitude},${rules.pumpLongitude}`)}
              >
                <Text style={styles.pumpLink}>Open in Maps</Text>
              </Pressable>
              <Pressable hitSlop={8} onPress={clearPump}>
                <Text style={styles.pumpLinkDanger}>Turn off distance check</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <Text style={styles.note}>
          Changing the rate does not alter points customers already have. Customers' apps pick up new values within a minute.
        </Text>

        {message ? <Text style={[styles.message, message.ok ? styles.messageOk : styles.messageError]}>{message.text}</Text> : null}

        <Pressable style={[styles.saveButton, (!changed || saving) && styles.disabled]} disabled={!changed || saving} onPress={save}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save settings'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pumpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pumpValue: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pumpUnset: {
    fontSize: FONT.body,
    fontWeight: '600',
    color: COLORS.danger,
    flex: 1,
  },
  pumpButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  pumpButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT.body,
  },
  pumpLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  pumpLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pumpLinkDanger: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },
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
  headerSubtitle: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: 12,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  label: {
    fontSize: FONT.label,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT.body,
    color: COLORS.textPrimary,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
  },
  note: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  message: {
    fontSize: 13,
  },
  messageOk: {
    color: COLORS.success,
    fontWeight: '600',
  },
  messageError: {
    color: COLORS.danger,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: FONT.body,
  },
  disabled: {
    opacity: 0.5,
  },
});
