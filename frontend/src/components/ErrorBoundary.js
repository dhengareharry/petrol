import { Component } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { useI18n } from '../i18n';
import { COLORS, FONT, RADIUS, SPACING } from '../theme';

function CrashScreen({ onRetry }) {
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Icon name="alert" size={34} color={COLORS.danger} />
      </View>
      <Text style={styles.title}>{t('crash.title')}</Text>
      <Text style={styles.text}>{t('crash.text')}</Text>
      <Pressable style={styles.button} onPress={onRetry} accessibilityRole="button">
        <Text style={styles.buttonText}>{t('crash.retry')}</Text>
      </Pressable>
    </View>
  );
}

/**
 * Catches a crash in any screen and shows a friendly message with a Try again button, instead of a blank screen.
 * Retrying re-renders the app from the top; the sign-in is untouched, so nothing is lost.
 */
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // The only place that sees the error; the console is what a developer reads when reproducing it.
    console.error('Screen crashed:', error);
  }

  render() {
    if (this.state.failed) return <CrashScreen onRetry={() => this.setState({ failed: false })} />;
    return this.props.children;
  }
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
    backgroundColor: COLORS.dangerSoft,
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
});
