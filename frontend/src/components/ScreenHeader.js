import { StyleSheet, Text, View } from 'react-native';
import GradientBox from './GradientBox';
import { COLORS, FONT, SPACING } from '../theme';

/** The title block at the top of a screen. `right` is an optional element (a button or a chip) shown at the end. */
export default function ScreenHeader({ title, subtitle, right }) {
  return (
    <GradientBox colors={[COLORS.primary, '#2D56BD']} style={styles.header}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </GradientBox>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  text: {
    flex: 1,
  },
  title: {
    color: COLORS.textOnPrimary,
    fontSize: FONT.title,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
});
