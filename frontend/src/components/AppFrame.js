import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from './AppHeader';
import TabBar from './TabBar';
import useLayout from '../utils/useLayout';
import { COLORS, SHADOW } from '../theme';

/**
 * The shell shared by the customer and staff panels: header on top, the screen in the middle, navigation below on phones
 * or down the left side on tablets. On wide screens the screen is centred with a maximum width instead of stretching edge to edge.
 */
export default function AppFrame({ header, tabs, activeKey, onChangeTab, children }) {
  const { isTablet, isWide, contentMaxWidth } = useLayout();

  return (
    // Left/right insets keep content clear of notches and rounded corners in landscape.
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <AppHeader {...header} />
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
