import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from '../components/Icon';
import { COLORS, FONT, RADIUS, SHADOW, SPACING } from '../theme';

const ConfirmContext = createContext(null);

/**
 * An in-app yes/no dialog that looks the same on the phone and in the browser (instead of the browser's own popup).
 *   const confirm = useConfirm();
 *   if (await confirm({ title, message, confirmLabel, cancelLabel, destructive, icon })) { ... }
 * Resolves true on the confirm button, false on Cancel, a tap outside the dialog, or the Back button / Escape key.
 */
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current?.(false); // a dialog that is somehow still open is dismissed first
        resolver.current = resolve;
        setDialog(options);
      }),
    []
  );

  const finish = useCallback((answer) => {
    const resolve = resolver.current;
    resolver.current = null;
    setDialog(null);
    resolve?.(answer);
  }, []);

  const value = useMemo(() => confirm, [confirm]);
  const destructive = Boolean(dialog?.destructive);
  const accent = destructive ? COLORS.danger : COLORS.primary;

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal visible={dialog !== null} transparent animationType="fade" onRequestClose={() => finish(false)} statusBarTranslucent>
        <View style={styles.overlay}>
          {/* A tap on the dark area behind the card counts as Cancel. */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => finish(false)} accessibilityLabel="Close" />
          {dialog ? (
            <View style={styles.card} accessibilityRole={Platform.OS === 'web' ? 'alertdialog' : undefined}>
              <View style={[styles.iconWrap, { backgroundColor: destructive ? COLORS.dangerSoft : COLORS.primarySoft }]}>
                <Icon name={dialog.icon || (destructive ? 'alert' : 'info')} size={26} color={accent} />
              </View>
              <Text style={styles.title}>{dialog.title}</Text>
              {dialog.message ? <Text style={styles.message}>{dialog.message}</Text> : null}
              <View style={styles.buttons}>
                <Pressable style={[styles.button, styles.cancelButton]} onPress={() => finish(false)}>
                  <Text style={styles.cancelText}>{dialog.cancelLabel || 'Cancel'}</Text>
                </Pressable>
                <Pressable style={[styles.button, { backgroundColor: accent }]} onPress={() => finish(true)} autoFocus>
                  <Text style={styles.confirmText}>{dialog.confirmLabel || 'OK'}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside ConfirmProvider');
  return confirm;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 31, 91, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
    ...SHADOW.raised,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  message: {
    fontSize: FONT.body,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  buttons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xxl,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  confirmText: {
    fontSize: FONT.body,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
  },
});
