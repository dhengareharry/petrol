import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { COLORS, SHADOW, SPACING } from '../theme';

/**
 * Navigation between the main sections. `tabs` are { key, label, icon, badge? }; the focused tab gets a soft pill behind its icon.
 * `variant="bar"` (phones) runs along the bottom; `variant="rail"` (tablets) is a vertical strip down the left side.
 */
export default function TabBar({ tabs, activeKey, onChange, variant = 'bar' }) {
  const insets = useSafeAreaInsets();
  const rail = variant === 'rail';

  return (
    <View style={rail ? styles.rail : [styles.bar, { paddingBottom: insets.bottom + SPACING.sm }]} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const focused = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            style={[rail ? styles.railButton : styles.button, focused && rail && styles.railButtonFocused]}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
          >
            <View style={[styles.pill, focused && !rail && styles.pillFocused]}>
              <Icon name={tab.icon} size={rail ? 24 : 22} color={focused ? COLORS.primary : COLORS.textMuted} strokeWidth={focused ? 2.1 : 1.8} />
              {tab.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge > 99 ? '99+' : tab.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, focused && styles.labelFocused]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingTop: SPACING.sm,
    ...SHADOW.bar,
  },
  button: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    gap: 2,
  },
  rail: {
    width: 92,
    backgroundColor: COLORS.surface,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingTop: SPACING.md,
    gap: SPACING.xs,
  },
  railButton: {
    alignItems: 'center',
    gap: 4,
    marginHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: 14,
  },
  railButtonFocused: {
    backgroundColor: COLORS.primarySoft,
  },
  pill: {
    width: 52,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillFocused: {
    backgroundColor: COLORS.primarySoft,
  },
  label: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  labelFocused: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: 2,
    backgroundColor: COLORS.accent,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  badgeText: {
    color: COLORS.textOnPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
});
