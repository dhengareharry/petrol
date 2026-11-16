import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRules } from '../../context/RulesContext';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';

const FIELDS = [
  {
    key: 'fuelRatePerLitre',
    label: 'Fuel rate (₹ per litre)',
    hint: 'Converts rupees to litres. 1 point is earned per litre, so a ₹600 fill-up at ₹100/ltr earns 6 points.',
    min: 1,
    max: 10000,
  },
  {
    key: 'minFuelAmountRupees',
    label: 'Minimum fill-up (₹)',
    hint: 'Fuel entries and fuel proofs below this amount do not earn points.',
    min: 1,
    max: 100000,
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

  const changed = FIELDS.some((f) => values[f.key].trim() !== String(rules[f.key]));

  async function save() {
    const changes = {};
    for (const field of FIELDS) {
      const text = values[field.key].trim();
      if (!/^\d+$/.test(text) || Number(text) < field.min || Number(text) > field.max) {
        setMessage({ ok: false, text: `${field.label}: enter a whole number from ${field.min} to ${field.max.toLocaleString('en-IN')}.` });
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
              keyboardType="number-pad"
              maxLength={6}
              value={values[field.key]}
              onChangeText={(text) => {
                setValues((prev) => ({ ...prev, [field.key]: text }));
                setMessage(null);
              }}
            />
            <Text style={styles.hint}>{field.hint}</Text>
          </View>
        ))}

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
