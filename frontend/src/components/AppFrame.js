import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from './AppHeader';
import TabBar from './TabBar';
import { useSession } from '../context/SessionContext';
import { useI18n } from '../i18n';
import useLayout from '../utils/useLayout';
import { COLORS, SHADOW } from '../theme';

/**
 * The shell shared by the customer and staff panels: header on top, the screen in the middle, navigation below on phones
 * or down the left side on tablets. On wide screens the screen is centred with a maximum width instead of stretching edge to edge.
 */
export default function AppFrame({ header, tabs, activeKey, onChangeTab, children }) {
  const { isTablet, isWide, contentMaxWidth } = useLayout();
  const { syncError } = useSession();
  const { t } = useI18n();

  return (
    // Left/right insets keep content clear of notches and rounded corners in landscape.
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <AppHeader {...header} />
      {syncError ? (
        <View style={styles.banner} accessibilityRole="alert">
          <Text style={styles.bannerText}>{t('sync.offline')}</Text>
        </View>
      ) : null}
      <View style={styles.body}>
        {isTablet && <TabBar variant="rail" tabs={tabs} activeKey={activeKey} onChange={onChangeTab} />}
        <View style={styles.stage}>
          <View style={[styles.column, contentMaxWidth ? { maxWidth: contentMaxWidth } : null, isWide && styles.columnWide]}>
            {children}
          </View>
        </View>
      </View>
      {!isTablet && <TabBar tabs={tabs} activeKey={activeKey} onChange={onChangeTab} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },
  banner: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bannerText: {
    color: COLORS.textOnPrimary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  column: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  columnWide: {
    backgroundColor: COLORS.background,
    ...SHADOW.card,
  },
});
