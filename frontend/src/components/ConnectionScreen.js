import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from './Icon';
import { useI18n } from '../i18n';
import { COLORS, FONT, RADIUS, SPACING } from '../theme';

/**
 * Shown when the app opens but cannot reach the server, so a signed-in user sees what happened and can retry
 * instead of being dropped on the login screen. Their saved sign-in is kept for the retry.
 */
export default function ConnectionScreen({ onRetry }) {
  const { t } = useI18n();
  const [retrying, setRetrying] = useState(false);

  async function retry() {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.badge}>
        <Icon name="alert" size={34} color={COLORS.accent} />
      </View>
      <Text style={styles.title}>{t('conn.title')}</Text>
      <Text style={styles.text}>{t('conn.text')}</Text>
      <Pressable style={[styles.button, retrying && styles.disabled]} disabled={retrying} onPress={retry} accessibilityRole="button">
        {retrying ? <ActivityIndicator color={COLORS.textOnPrimary} /> : <Text style={styles.buttonText}>{t('conn.retry')}</Text>}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    backgroundColor: COLORS.background,
  },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT.heading,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  text: {
    fontSize: FONT.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
    maxWidth: 320,
    lineHeight: 21,
  },
  button: {
    minWidth: 180,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl,
  },
  buttonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '800',
    fontSize: FONT.label,
  },
  disabled: {
    opacity: 0.7,
  },
});
