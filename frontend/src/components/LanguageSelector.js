import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { useI18n } from '../i18n';
import { COLORS, FONT, RADIUS, SPACING } from '../theme';

/** The language list for the Profile tab: each language in its own script, with a tick on the one in use. */
export default function LanguageSelector() {
  const { language, setLanguage, languages, t } = useI18n();

  return (
    <View>
      <Text style={styles.subtitle}>{t('language.subtitle')}</Text>
      <View accessibilityRole="radiogroup" style={styles.list}>
        {languages.map((item) => {
          const selected = item.code === language;
          return (
            <Pressable
              key={item.code}
              style={[styles.row, selected && styles.rowSelected]}
              onPress={() => setLanguage(item.code)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${item.nativeName} (${item.name})`}
            >
              <View style={styles.names}>
                <Text style={[styles.native, selected && styles.nativeSelected]}>{item.nativeName}</Text>
                {item.nativeName !== item.name ? <Text style={styles.english}>{item.name}</Text> : null}
              </View>
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? <Icon name="check" size={14} color={COLORS.textOnPrimary} strokeWidth={3} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  list: {
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  rowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  names: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
    flexShrink: 1,
  },
  native: {
    fontSize: FONT.title,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  nativeSelected: {
    color: COLORS.primary,
  },
  english: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.borderInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});
