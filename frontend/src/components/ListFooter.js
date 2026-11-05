import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n';
import { COLORS, SPACING } from '../theme';

/** The end of a paged list: a spinner while loading, otherwise a "Load more" button (or the error that stopped it). */
export default function ListFooter({ loading, loadingMore, hasMore, error, onLoadMore, hasItems }) {
  const { t } = useI18n();
  if (loading && !hasItems) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }
  if (loadingMore) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }
  return (
    <View style={styles.wrap}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {hasMore ? (
        <Pressable onPress={onLoadMore}>
          <Text style={styles.more}>{t('common.loadMore')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  more: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  error: {
    color: COLORS.danger,
    fontSize: 12,
    textAlign: 'center',
  },
});
