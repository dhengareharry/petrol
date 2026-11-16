import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { checkRegistration, resetCustomerPin } from '../api/auth';
import { sendOtp } from '../api/otp';
import GradientBox from '../components/GradientBox';
import Icon from '../components/Icon';
import LanguageSwitch from '../components/LanguageSwitch';
import Logo from '../components/Logo';
import VehicleNumberInput from '../components/VehicleNumberInput';
import { useRules } from '../context/RulesContext';
import { useI18n } from '../i18n';
import { openPrivacyPolicy } from '../utils/links';
import { cleanPhoneInput, isValidMobile, mobileHint } from '../utils/phone';
import useLayout from '../utils/useLayout';
import { COLORS, FONT, RADIUS, SHADOW, SPACING } from '../theme';

const maskPhone = (phone) => `+91 ${phone.slice(0, 2)}••••${phone.slice(-4)}`;
const looksLikePhone = (value) => /^\d+$/.test(value);

/** A bordered input with a leading icon. */
function Field({ icon, style, ...props }) {
  return (
    <View style={[styles.field, style]}>
      <Icon name={icon} size={18} color={COLORS.textMuted} />
      <TextInput
        style={styles.fieldInput}
        placeholderTextColor={COLORS.textMuted}
        underlineColorAndroid="transparent"
        {...props}
      />
    </View>
  );
}

/**
 * The one entry screen. Sign-in is a single form: a 10-digit phone number signs a customer in (with their PIN), anything
 * else is a staff username (with their password), and the app opens the matching panel. Customers can also sign up here.
 *
 * SMS verification is a server switch (`otpEnabled` in the program rules). While it is off, sign-up is a single step and a
 * customer who forgot their PIN is told to ask the cashier, who resets it. When it is on, signing up and resetting a PIN take
 * a second step: an SMS code (sent by the backend through Fast2SMS) proves the phone number before anything changes.
 */
export default function LoginScreen({ onLogin, onRegister }) {
  const { referralBonusPoints, otpEnabled } = useRules();
  const { height, isTablet } = useLayout();
  const { t, errorText } = useI18n();
  const compact = height < 560; // a phone held sideways: shrink the header so the form stays reachable
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

  function goTo(nextMode) {
    resetFields();
    setMode(nextMode);
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
    const who = phone.trim();
    if (!who) {
      setError(t('login.enterWho'));
      return;
    }
    const isCustomer = looksLikePhone(who);
    // A staff username can never be all digits, so digits alone must be a complete 10-digit phone number.
    if (isCustomer && who.length !== 10) {
      setError(t('phone.invalid'));
      return;
    }
    if (!pin) {
      setError(isCustomer ? t('login.enterPin') : t('login.enterPassword'));
      return;
    }
    setSubmitting(true);
    try {
      await onLogin(who, isCustomer ? pin.trim() : pin);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  // Validates the sign-up / reset details. Returns an error message, or '' when everything is fine.
  function validateDetails(details) {
    if (!resetting && !details.name) return t('login.enterName');
    if (!isValidMobile(details.phone)) return t('phone.invalidStart');
    if (!/^\d{4}$/.test(details.pin)) return resetting ? t('login.chooseNewPin') : t('login.choosePinError');
    if (details.referredByPhone && !/^\d{10}$/.test(details.referredByPhone)) {
      return t('login.referralInvalid');
    }
    return '';
  }

  // Create Account (SMS off), or the first step of sign-up / PIN reset (SMS on: check the details, then text a code).
  async function submitDetails() {
    setError('');
    const details = registration();
    const problem = validateDetails(details);
    if (problem) {
      setError(problem);
      return;
    }
    setSubmitting(true);
    try {
      // Catch problems (number already registered, bad vehicle, bad referral code) before anything is sent or created.
      if (!resetting) await checkRegistration(details);
      if (!otpEnabled) {
        await onRegister(details);
        return;
      }
      const result = await sendOtp(details.phone, resetting ? 'RESET_PIN' : 'REGISTER');
      setDevOtp(result.devOtp ?? null);
      setResendIn(result.resendInSeconds ?? 30);
      setCode('');
      setStep('otp');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmCode() {
    setError('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError(t('login.enterCode'));
      return;
    }
    setSubmitting(true);
    try {
      if (resetting) {
        await resetCustomerPin(phone.trim(), code.trim(), pin.trim());
        resetFields();
        setMode('login');
        setNotice(t('login.pinChangedNotice'));
        return;
      }
      // The server checks the code and creates the account in one step, then we are signed in.
      await onRegister({ ...registration(), otp: code.trim() });
    } catch (err) {
      setError(errorText(err));
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
  const verifying = otpEnabled && (registering || resetting) && step === 'otp';
  const staffHelpOnly = resetting && !otpEnabled; // no SMS, so a forgotten PIN is reset by the cashier
  const phoneHint = registering || resetting ? mobileHint(phone, t) : '';

  let title = t('login.welcome');
  let subtitle = t('login.welcomeSub');
  if (staffHelpOnly) {
    title = t('login.forgotTitle');
    subtitle = t('login.forgotSub');
  } else if (resetting) {
    title = verifying ? t('login.verifyTitle') : t('login.resetTitle');
    subtitle = verifying ? t('login.verifySub', { phone: maskPhone(phone.trim()) }) : t('login.resetSub');
  } else if (registering) {
    title = verifying ? t('login.verifyTitle') : t('login.createTitle');
    subtitle = verifying ? t('login.verifySub', { phone: maskPhone(phone.trim()) }) : t('login.createSub');
  }

  const submitLabel = submitting
    ? t('login.wait')
    : registering
      ? otpEnabled
        ? t('login.sendOtp')
        : t('login.createButton')
      : resetting
        ? t('login.sendOtp')
        : t('login.loginButton');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={styles.flexFill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <GradientBox colors={[COLORS.primaryDark, COLORS.primary, '#2D56BD']} style={styles.hero}>
            <View style={[styles.blob, styles.blobOrange]} />
            <View style={[styles.blob, styles.blobGreen]} />
            <LanguageSwitch style={styles.languageSwitch} />
            {mode !== 'login' && (
              <Pressable style={styles.backButton} onPress={verifying ? editDetails : () => goTo('login')} hitSlop={8}>
                <Text style={styles.backText}>{verifying ? t('login.editArrow') : t('login.backArrow')}</Text>
              </Pressable>
            )}
            <Logo size={compact ? 56 : mode === 'login' ? 112 : 84} style={styles.logo} />
            <Text style={styles.brand}>Oasis Fuel Rewards</Text>
            {!compact && <Text style={styles.tagline}>{t('login.tagline')}</Text>}
          </GradientBox>

          <View style={[styles.card, isTablet && styles.cardTablet]}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {staffHelpOnly ? (
              <>
                <View style={styles.infoBox}>
                  <Icon name="info" size={20} color={COLORS.primary} />
                  <Text style={styles.infoText}>{t('login.forgotInfo')}</Text>
                </View>
                <Pressable style={styles.submitButton} onPress={() => goTo('login')}>
                  <Text style={styles.submitButtonText}>{t('login.backToLogin')}</Text>
                </Pressable>
              </>
            ) : verifying ? (
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
                  <Text style={styles.submitButtonText}>
                    {submitting ? t('login.wait') : resetting ? t('login.verifyReset') : t('login.verifyCreate')}
                  </Text>
                </Pressable>

                <Pressable style={styles.toggleLink} disabled={resendIn > 0 || submitting} onPress={submitDetails}>
                  <Text style={[styles.toggleLinkText, (resendIn > 0 || submitting) && styles.linkDisabled]}>
                    {resendIn > 0 ? t('login.resendIn', { n: resendIn }) : t('login.resend')}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                {registering && (
                  <Field icon="user" placeholder={t('login.fullName')} value={name} onChangeText={setName} autoCapitalize="words" maxLength={100} />
                )}

                <Field
                  icon={mode === 'login' ? 'user' : 'phone'}
                  placeholder={mode === 'login' ? t('login.phoneOrUser') : t('login.mobile')}
                  keyboardType={mode === 'login' ? 'default' : 'number-pad'}
                  maxLength={mode === 'login' ? 64 : 10}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={phone}
                  onChangeText={(text) => setPhone(mode === 'login' ? text : cleanPhoneInput(text))}
                />
                {phoneHint ? <Text style={styles.fieldHint}>{phoneHint}</Text> : null}
                {(registering || resetting) && isValidMobile(phone) ? (
                  <View style={styles.fieldOkRow}>
                    <Icon name="check" size={13} color={COLORS.success} strokeWidth={2.6} />
                    <Text style={styles.fieldOk}>{t('login.validMobile')}</Text>
                  </View>
                ) : null}

                {registering && (
                  <>
                    <Field
                      icon="car"
                      placeholder={t('login.vehicleModel')}
                      maxLength={60}
                      value={vehicleModel}
                      onChangeText={setVehicleModel}
                    />
                    <VehicleNumberInput
                      style={styles.input}
                      placeholder={t('login.vehicleNumber')}
                      value={vehicleNumber}
                      onChangeText={setVehicleNumber}
                    />
                  </>
                )}

                <Field
                  icon="lock"
                  placeholder={registering ? t('login.choosePin') : resetting ? t('login.newPin') : t('login.pinOrPassword')}
                  keyboardType={mode === 'login' ? 'default' : 'number-pad'}
                  secureTextEntry
                  autoCapitalize="none"
                  maxLength={mode === 'login' ? 100 : 4}
                  value={pin}
                  onChangeText={(text) => setPin(mode === 'login' ? text : text.replace(/\D/g, ''))}
                />

                {registering && (
                  <>
                    <Field
                      icon="gift"
                      placeholder={t('login.referral')}
                      keyboardType="number-pad"
                      maxLength={10}
                      value={referralCode}
                      onChangeText={(text) => setReferralCode(cleanPhoneInput(text))}
                    />
                    <Text style={styles.referralHint}>{t('login.referralHint', { n: referralBonusPoints })}</Text>
                  </>
                )}

                <Pressable
                  style={[styles.submitButton, submitting && styles.disabled]}
                  disabled={submitting}
                  onPress={registering || resetting ? submitDetails : handleLogin}
                >
                  <Text style={styles.submitButtonText}>{submitLabel}</Text>
                </Pressable>

                {(registering || resetting) && otpEnabled && (
                  <Text style={styles.hint}>{t('login.otpHint')}</Text>
                )}

                {mode === 'login' && (
                  <Pressable style={styles.toggleLink} onPress={() => goTo('reset')}>
                    <Text style={styles.toggleLinkText}>{t('login.forgotLink')}</Text>
                  </Pressable>
                )}

                <Pressable style={styles.toggleLink} onPress={() => goTo(mode === 'login' ? 'register' : 'login')}>
                  <Text style={styles.toggleLinkText}>
                    {registering ? t('login.haveAccount') : resetting ? t('login.backToLogin') : t('login.newCustomer')}
                  </Text>
                </Pressable>
              </>
            )}

            <Pressable style={styles.privacyLink} onPress={openPrivacyPolicy} hitSlop={10} accessibilityRole="link">
              <Text style={styles.privacyText}>{t('login.privacy')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },
  flexFill: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: SPACING.xl,
  },
  languageSwitch: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 2,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobOrange: {
    width: 180,
    height: 180,
    top: -70,
    left: -60,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  blobGreen: {
    width: 150,
    height: 150,
    bottom: -60,
    right: -40,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  backText: {
    color: COLORS.textOnPrimary,
    fontSize: FONT.body,
    fontWeight: '700',
  },
  logo: {
    borderRadius: 24,
    marginBottom: SPACING.md,
  },
  brand: {
    color: COLORS.textOnPrimary,
    fontSize: FONT.heading,
    fontWeight: '800',
  },
  tagline: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: 13,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    marginTop: -32,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xxl,
    ...SHADOW.raised,
  },
  cardTablet: {
    maxWidth: 480,
    padding: SPACING.xxl,
  },
  title: {
    fontSize: FONT.heading,
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
    backgroundColor: COLORS.dangerSoft,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  notice: {
    color: COLORS.success,
    backgroundColor: COLORS.successSoft,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  fieldInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT.label,
    color: COLORS.textPrimary,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  fieldHint: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  fieldOkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  fieldOk: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.background,
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
  devHint: {
    fontSize: 12,
    color: COLORS.accentText,
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  infoBox: {
    flexDirection: 'row',
    gap: SPACING.md,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textPrimary,
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
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  submitButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '800',
    fontSize: FONT.label,
  },
  disabled: {
    opacity: 0.6,
  },
  toggleLink: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  toggleLinkText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  privacyLink: {
    alignSelf: 'center',
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
  },
  privacyText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textDecorationLine: 'underline',
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
