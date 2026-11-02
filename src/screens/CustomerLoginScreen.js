import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { checkRegistration, resetCustomerPin } from '../api/auth';
import { sendOtp } from '../api/otp';
import Logo from '../components/Logo';
import VehicleNumberInput from '../components/VehicleNumberInput';
import { COLORS, FONT, RADIUS, SPACING } from '../theme';

const maskPhone = (phone) => `+91 ${phone.slice(0, 2)}••••${phone.slice(-4)}`;

/**
 * Customer sign-in, sign-up and forgotten-PIN reset. Signing up and resetting a PIN are both two steps: enter details,
 * then prove the phone number with an SMS code (sent by the backend through Fast2SMS) before anything changes.
 */
export default function CustomerLoginScreen({ onLogin, onRegister, onBack }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'reset'
  const [step, setStep] = useState('details'); // register / reset only: 'details' | 'otp'
  const [notice, setNotice] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [code, setCode] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  function resetFields() {
    setError('');
    setNotice('');
    setStep('details');
    setPhone('');
    setPin('');
    setName('');
    setVehicleModel('');
    setVehicleNumber('');
    setReferralCode('');
    setCode('');
    setDevOtp(null);
    setResendIn(0);
  }

  const registration = () => ({
    name: name.trim(),
    phone: phone.trim(),
    vehicleModel: vehicleModel.trim(),
    vehicleNumber: vehicleNumber.trim(),
    pin: pin.trim(),
    referredByPhone: referralCode.trim(),
  });

  async function handleLogin() {
    setError('');
    setNotice('');
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

  // Step 1 → 2 (also used by "Resend"): check the details, then text a code to the phone number.
  async function requestCode() {
    setError('');
    const details = registration();
    if (resetting) {
      if (!/^\d{10}$/.test(details.phone)) {
        setError('Enter the 10-digit phone number of your account.');
        return;
      }
      if (!/^\d{4}$/.test(details.pin)) {
        setError('Choose a new 4-digit PIN.');
        return;
      }
    } else {
      if (!details.name || !/^\d{10}$/.test(details.phone)) {
        setError('Enter your name and a valid 10-digit phone number.');
        return;
      }
      if (!/^\d{4}$/.test(details.pin)) {
        setError('Choose a 4-digit PIN.');
        return;
      }
    }
    setSubmitting(true);
    try {
      // Catch problems (number already registered, bad vehicle, bad referral code) *before* spending an SMS.
      if (!resetting) await checkRegistration(details);
      const result = await sendOtp(details.phone, resetting ? 'RESET_PIN' : 'REGISTER');
      setDevOtp(result.devOtp ?? null);
      setResendIn(result.resendInSeconds ?? 30);
      setCode('');
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmCode() {
    setError('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code from the SMS.');
      return;
    }
    setSubmitting(true);
    try {
      if (resetting) {
        await resetCustomerPin(phone.trim(), code.trim(), pin.trim());
        resetFields();
        setMode('login');
        setNotice('Your PIN was changed. Log in with your new PIN.');
        return;
      }
      // The server checks the code and creates the account in one step, then we are signed in.
      await onRegister({ ...registration(), otp: code.trim() });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function editDetails() {
    setError('');
    setCode('');
    setDevOtp(null);
    setStep('details');
  }

  const registering = mode === 'register';
  const resetting = mode === 'reset';
  const verifying = (registering || resetting) && step === 'otp';

  let title = 'Customer Login';
  let subtitle = 'Enter your phone number and PIN';
  if (resetting) {
    title = verifying ? 'Verify your phone' : 'Reset PIN';
    subtitle = verifying
      ? `Enter the 6-digit code we sent to ${maskPhone(phone.trim())}`
      : 'Enter your phone number and choose a new PIN';
  } else if (registering) {
    title = verifying ? 'Verify your phone' : 'Create Account';
    subtitle = verifying
      ? `Enter the 6-digit code we sent to ${maskPhone(phone.trim())}`
      : 'Sign up to start earning reward points';
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flexFill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backButton} onPress={verifying ? editDetails : onBack}>
          <Text style={styles.backText}>{verifying ? '‹ Edit details' : '‹ Back'}</Text>
        </Pressable>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Logo size={88} style={styles.icon} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {verifying ? (
            <>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="------"
                placeholderTextColor={COLORS.borderInput}
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
                autoComplete="sms-otp"
                textContentType="oneTimeCode"
                autoFocus
              />

              {__DEV__ && devOtp ? (
                <Text style={styles.devHint}>Dev mode: the server is not sending real SMS. Your code is {devOtp}.</Text>
              ) : null}

              <Pressable
                style={[styles.submitButton, (submitting || code.length !== 6) && styles.disabled]}
                disabled={submitting || code.length !== 6}
                onPress={confirmCode}
              >
                <Text style={styles.submitButtonText}>{submitting ? 'Please wait…' : resetting ? 'Verify & Reset PIN' : 'Verify & Create Account'}</Text>
              </Pressable>

              <Pressable
                style={styles.toggleLink}
                disabled={resendIn > 0 || submitting}
                onPress={requestCode}
              >
                <Text style={[styles.toggleLinkText, (resendIn > 0 || submitting) && styles.linkDisabled]}>
                  {resendIn > 0 ? `Resend code in ${resendIn}s` : "Didn't get it? Resend code"}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              {registering && (
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
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />

              {registering && (
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
                placeholder={registering ? 'Choose a 4-digit PIN' : resetting ? 'New 4-digit PIN' : 'PIN'}
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                value={pin}
                onChangeText={setPin}
              />

              {registering && (
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
                    Got a friend's referral code? Enter their phone number here — you'll both get 100 bonus points.
                  </Text>
                </>
              )}

              <Pressable
                style={[styles.submitButton, submitting && styles.disabled]}
                disabled={submitting}
                onPress={registering || resetting ? requestCode : handleLogin}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'Please wait…' : registering || resetting ? 'Send OTP' : 'Login'}
                </Text>
              </Pressable>

              {(registering || resetting) && (
                <Text style={styles.hint}>We'll text a 6-digit code to verify your phone number.</Text>
              )}

              {mode === 'login' && (
                <Pressable
                  style={styles.toggleLink}
                  onPress={() => {
                    resetFields();
                    setMode('reset');
                  }}
                >
                  <Text style={styles.toggleLinkText}>Forgot PIN?</Text>
                </Pressable>
              )}

              <Pressable
                style={styles.toggleLink}
                onPress={() => {
                  resetFields();
                  setMode((m) => (m === 'register' || m === 'reset' ? 'login' : 'register'));
                }}
              >
                <Text style={styles.toggleLinkText}>
                  {mode === 'register' ? 'Already have an account? Login' : resetting ? 'Back to login' : 'New here? Create an account'}
                </Text>
              </Pressable>

              {mode === 'login' && <Text style={styles.hint}>Demo accounts use PIN 1234</Text>}
            </>
          )}
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
    alignSelf: 'center',
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
  codeInput: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 10,
    textAlign: 'center',
  },
  notice: {
    color: COLORS.success,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  devHint: {
    fontSize: 12,
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    textAlign: 'center',
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
  linkDisabled: {
    color: COLORS.textMuted,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});
