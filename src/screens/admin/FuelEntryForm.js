import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { REWARDS } from '../../data/rewards';
import { FUEL_RATE_PER_LITRE, MIN_FUEL_AMOUNT_RUPEES, MIN_FUEL_LITRES } from '../../storage/customerStore';
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
  const [rupeesText, setRupeesText] = useState('');
  const [litresText, setLitresText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

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

  async function submit(rupees) {
    const amountRupees = Number(rupees);
    const litres = amountRupees / FUEL_RATE_PER_LITRE;

    if (!amountRupees || amountRupees < MIN_FUEL_AMOUNT_RUPEES) {
      notify(
        'Entry too small',
        `Fuel entry must be at least ₹${MIN_FUEL_AMOUNT_RUPEES} (${MIN_FUEL_LITRES} ltr) to qualify for reward points.`
      );
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      const oldPoints = customer.points;
      const updated = await onCreditPoints(customer.phone, litres);
      const pointsEarned = Math.round(litres);
      const unlocked = REWARDS.filter((r) => r.points > oldPoints && r.points <= updated.points);

      setResult({
        amountRupees,
        litres: pointsEarned,
        newBalance: updated.points,
        unlocked,
      });
      setRupeesText('');
      setLitresText('');
    } catch (err) {
      notify('Could not add points', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View>
      <Text style={styles.helperText}>
        Rate: ₹{FUEL_RATE_PER_LITRE}/ltr · Minimum ₹{MIN_FUEL_AMOUNT_RUPEES} per entry to qualify for points.
      </Text>

      <View style={styles.row}>
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Amount (₹)</Text>
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

      <Pressable
        style={[styles.primaryButton, submitting && styles.disabled]}
        disabled={submitting}
        onPress={() => submit(rupeesText)}
      >
        <Text style={styles.primaryButtonText}>{submitting ? 'Adding…' : 'Add Fuel Entry'}</Text>
      </Pressable>

      <View style={styles.quickRow}>
        {QUICK_RUPEE_AMOUNTS.map((amount) => (
          <Pressable
            key={amount}
            style={[styles.quickButton, submitting && styles.disabled]}
            disabled={submitting}
            onPress={() => submit(amount)}
          >
            <Text style={styles.quickButtonText}>₹{amount}</Text>
          </Pressable>
        ))}
      </View>

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>✅ Fuel entry recorded</Text>
          <Text style={styles.resultLine}>
            ₹{result.amountRupees.toLocaleString()} · {result.litres.toLocaleString()} ltr → +
            {result.litres.toLocaleString()} pts
          </Text>
          <Text style={styles.resultLine}>New balance: {result.newBalance.toLocaleString()} pts</Text>

          {result.unlocked.length > 0 && (
            <View style={styles.unlockedBox}>
              <Text style={styles.unlockedTitle}>🎉 Newly unlocked reward{result.unlocked.length > 1 ? 's' : ''}</Text>
              {result.unlocked.map((r) => (
                <Text key={r.id} style={styles.unlockedItem}>
                  {r.icon} {r.name} ({r.points.toLocaleString()} pts)
                </Text>
              ))}
            </View>
          )}

          <View style={styles.messagePreview}>
            <Text style={styles.messagePreviewLabel}>Message preview (simulated — no SMS gateway wired up)</Text>
            <Text style={styles.messagePreviewText}>
              Hi {customer.name}, you earned {result.litres.toLocaleString()} points for your ₹
              {result.amountRupees.toLocaleString()} fuel purchase! Balance: {result.newBalance.toLocaleString()} pts.
              {result.unlocked.length > 0
                ? ` You've unlocked ${result.unlocked[0].name}${result.unlocked.length > 1 ? ' and more' : ''}!`
                : ''}
            </Text>
          </View>
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
    marginTop: SPACING.md,
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
  messagePreview: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  },
  messagePreviewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  messagePreviewText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
});
