import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import VehicleNumberInput from '../components/VehicleNumberInput';
import { COLORS, FONT, RADIUS, SPACING } from '../theme';

export default function CustomerLoginScreen({ onLogin, onRegister, onBack }) {
  const [mode, setMode] = useState('login');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function resetFields() {
    setError('');
    setPhone('');
    setPin('');
    setName('');
    setVehicleModel('');
    setVehicleNumber('');
    setReferralCode('');
  }

  async function handleLogin() {
    setError('');
    if (!/^\d{10}$/.test(phone.trim())) {
      setError('Enter a valid 10-digit phone number.');
      return;
    }
    setSubmitting(true);
    try {
      await onLogin(phone.trim(), pin.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister() {
    setError('');
    if (!name.trim() || !/^\d{10}$/.test(phone.trim())) {
      setError('Enter your name and a valid 10-digit phone number.');
      return;
    }
    if (pin.trim().length !== 4 || Number.isNaN(Number(pin.trim()))) {
      setError('Choose a 4-digit PIN.');
      return;
    }
    setSubmitting(true);
    try {
      await onRegister({
        name: name.trim(),
        phone: phone.trim(),
        vehicleModel: vehicleModel.trim(),
        vehicleNumber: vehicleNumber.trim(),
        pin: pin.trim(),
        referredByPhone: referralCode.trim(),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView style={styles.flexFill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.icon}>👤</Text>
        <Text style={styles.title}>{mode === 'login' ? 'Customer Login' : 'Create Account'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? 'Enter your phone number and PIN' : 'Sign up to start earning reward points'}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {mode === 'register' && (
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={COLORS.textMuted}
            value={name}
            onChangeText={setName}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="10-digit phone number"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="numeric"
          value={phone}
          onChangeText={setPhone}
        />

        {mode === 'register' && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Vehicle model (optional, e.g. Land Cruiser)"
              placeholderTextColor={COLORS.textMuted}
              value={vehicleModel}
              onChangeText={setVehicleModel}
            />
            <VehicleNumberInput
              style={styles.input}
              placeholder="Vehicle number (optional)"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
            />
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder={mode === 'login' ? 'PIN' : 'Choose a 4-digit PIN'}
          placeholderTextColor={COLORS.textMuted}
          keyboardType="numeric"
          secureTextEntry
          maxLength={4}
          value={pin}
          onChangeText={setPin}
        />

        {mode === 'register' && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Referral code (optional)"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              value={referralCode}
              onChangeText={setReferralCode}
            />
            <Text style={styles.referralHint}>
              Got a friend's referral code? Enter their phone number here — they'll earn 100 bonus points.
            </Text>
          </>
        )}

        <Pressable
          style={[styles.submitButton, submitting && styles.disabled]}
          disabled={submitting}
          onPress={mode === 'login' ? handleLogin : handleRegister}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create Account'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.toggleLink}
          onPress={() => {
            resetFields();
            setMode((m) => (m === 'login' ? 'register' : 'login'));
          }}
        >
          <Text style={styles.toggleLinkText}>
            {mode === 'login' ? "New here? Create an account" : 'Already have an account? Login'}
          </Text>
        </Pressable>

        {mode === 'login' && <Text style={styles.hint}>Demo accounts use PIN 1234</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flexFill: {
    flex: 1,
  },
  backButton: {
    padding: SPACING.lg,
  },
  backText: {
    color: COLORS.primary,
    fontSize: FONT.body,
    fontWeight: '700',
  },
  content: {
    flexGrow: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
    maxWidth: 360,
    width: '100%',
    alignSelf: 'center',
  },
  icon: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  error: {
    color: COLORS.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT.label,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  referralHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  submitButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: FONT.label,
  },
  disabled: {
    opacity: 0.6,
  },
  toggleLink: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  toggleLinkText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});
