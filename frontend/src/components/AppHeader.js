import { Pressable, StyleSheet, Text, View } from 'react-native';
import GradientBox from './GradientBox';
import Icon from './Icon';
import Logo from './Logo';
import { COLORS, FONT, SPACING } from '../theme';

/**
 * The strip across the top of both panels: the logo, who is signed in, and a few icon buttons.
 * `actions` are { icon, label, onPress }; `pill` is an optional small tag next to the title (e.g. the staff role).
 */
export default function AppHeader({ eyebrow, title, pill, caption, actions = [] }) {
  return (
    <GradientBox colors={[COLORS.primaryDark, COLORS.primary]} style={styles.header}>
      <Logo size={38} style={styles.logo} />
      <View style={styles.text}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {pill ? (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{pill}</Text>
            </View>
          ) : null}
        </View>
        {caption ? (
          <Text style={styles.caption} numberOfLines={1}>
            {caption}
          </Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            style={styles.action}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            hitSlop={8}
          >
            <Icon name={action.icon} size={20} color={COLORS.textOnPrimary} />
            {action.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{action.badge > 99 ? '99+' : action.badge}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </GradientBox>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  logo: {
    borderRadius: 10,
  },
  text: {
    flex: 1,
  },
  eyebrow: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: 11,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    flexShrink: 1,
    color: COLORS.textOnPrimary,
    fontSize: FONT.label,
    fontWeight: '800',
  },
  pill: {
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  pillText: {
    color: COLORS.textOnPrimary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  caption: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: 11,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: COLORS.accent,
    borderWidth: 1.5,
    borderColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: COLORS.textOnPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
  action: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
