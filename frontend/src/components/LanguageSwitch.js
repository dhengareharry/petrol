import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n';
import { COLORS, SPACING } from '../theme';

/** A small three-way language toggle for places without room for the full list (the login screen's header). */
export default function LanguageSwitch({ style }) {
  const { language, setLanguage, languages, t } = useI18n();

  return (
    <View style={[styles.group, style]} accessibilityRole="radiogroup" accessibilityLabel={t('language.label')}>
      {languages.map((item) => {
        const selected = item.code === language;
        return (
          <Pressable
            key={item.code}
            style={[styles.pill, selected && styles.pillSelected]}
            onPress={() => setLanguage(item.code)}
            hitSlop={{ top: 8, bottom: 8 }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${item.nativeName} (${item.name})`}
          >
            <Text style={[styles.text, selected && styles.textSelected]}>{item.nativeName}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    padding: 3,
  },
  pill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 999,
  },
  pillSelected: {
    backgroundColor: COLORS.surface,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
  },
  textSelected: {
    color: COLORS.primary,
  },
});
