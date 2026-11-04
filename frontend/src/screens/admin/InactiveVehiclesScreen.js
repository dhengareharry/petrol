import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import usePagedList from '../../api/usePagedList';
import GradientBox from '../../components/GradientBox';
import Icon from '../../components/Icon';
import IconTile from '../../components/IconTile';
import ListFooter from '../../components/ListFooter';
import { COLORS, FONT, RADIUS, SHADOW, SPACING } from '../../theme';

const formatDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

// How long a vehicle has been quiet decides the colour of its chip: orange at first, red once it is clearly lapsing.
const severity = (days) => (days >= 60 ? 'high' : 'medium');

function VehicleCard({ item, onOpenCustomer }) {
  const { vehicle, customer } = item;
  const high = severity(item.daysInactive) === 'high';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <IconTile name="car" size={46} color={high ? COLORS.danger : COLORS.accent} background={high ? COLORS.dangerSoft : COLORS.accentSoft} />
        <View style={styles.cardText}>
          <Text style={styles.number}>{vehicle.number}</Text>
          {vehicle.model ? <Text style={styles.model}>{vehicle.model}</Text> : null}
          <Text style={styles.customer} numberOfLines={1}>
            {customer.name} · {customer.phone}
          </Text>
        </View>
        <View style={[styles.chip, high ? styles.chipHigh : styles.chipMedium]}>
          <Text style={[styles.chipValue, high ? styles.chipTextHigh : styles.chipTextMedium]}>{item.daysInactive}</Text>
          <Text style={[styles.chipLabel, high ? styles.chipTextHigh : styles.chipTextMedium]}>days</Text>
        </View>
      </View>

      <Text style={styles.lastFill}>
        {item.lastFillAt
          ? `Last fuel fill: ${formatDate(item.lastFillAt)}`
          : `Never filled fuel · vehicle added ${formatDate(vehicle.addedAt)}`}
      </Text>

      <View style={styles.actions}>
        <Pressable
          style={[styles.action, styles.callAction]}
          onPress={() => Linking.openURL(`tel:${customer.phone}`).catch(() => undefined)}
          accessibilityRole="button"
          accessibilityLabel={`Call ${customer.name}`}
        >
          <Icon name="phone" size={16} color={COLORS.textOnPrimary} />
          <Text style={styles.callText}>Call</Text>
        </Pressable>
        <Pressable
          style={[styles.action, styles.viewAction]}
          onPress={() => onOpenCustomer(customer.phone)}
          accessibilityRole="button"
          accessibilityLabel={`View ${customer.name}`}
        >
          <Icon name="user" size={16} color={COLORS.primary} />
          <Text style={styles.viewText}>View customer</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * The admin's alert list: vehicles that have not filled fuel for a while (30 days by default, set by the server), each with
 * the customer to contact. Opens from the bell in the header or the dashboard card.
 */
export default function InactiveVehiclesScreen({ fetchPage, reloadKey, days, onBack, onOpenCustomer }) {
  const list = usePagedList((page) => fetchPage(page), [reloadKey]);

  return (
    <View style={styles.container}>
      <GradientBox colors={[COLORS.primary, '#2D56BD']} style={styles.header}>
        <Pressable onPress={onBack} hitSlop={10} style={styles.backButton}>
          <Text style={styles.backText}>‹ Dashboard</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Inactive vehicles</Text>
        <Text style={styles.headerSubtitle}>No fuel fill for more than {days} days. Contact these customers.</Text>
      </GradientBox>

      <FlatList
        data={list.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VehicleCard item={item} onOpenCustomer={onOpenCustomer} />}
        contentContainerStyle={styles.listContent}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          list.loading ? null : (
            <View style={styles.empty}>
              <IconTile name="checkCircle" size={64} color={COLORS.success} background={COLORS.successSoft} />
              <Text style={styles.emptyTitle}>All vehicles are active</Text>
              <Text style={styles.emptyText}>Every vehicle has filled fuel in the last {days} days.</Text>
            </View>
          )
        }
        ListFooterComponent={
          <ListFooter
            loading={list.loading}
            loadingMore={list.loadingMore}
            hasMore={list.hasMore}
            error={list.error}
            onLoadMore={list.loadMore}
            hasItems={list.items.length > 0}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.xs,
  },
  backText: {
    color: COLORS.textOnPrimary,
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.9,
  },
  headerTitle: {
    color: COLORS.textOnPrimary,
    fontSize: FONT.title,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: 12,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW.card,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  cardText: {
    flex: 1,
  },
  number: {
    fontSize: FONT.label,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  model: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  customer: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  chip: {
    alignItems: 'center',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    minWidth: 58,
  },
  chipMedium: {
    backgroundColor: COLORS.accentSoft,
  },
  chipHigh: {
    backgroundColor: COLORS.dangerSoft,
  },
  chipValue: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  chipTextMedium: {
    color: COLORS.accentText,
  },
  chipTextHigh: {
    color: COLORS.danger,
  },
  lastFill: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    minHeight: 44,
    borderRadius: RADIUS.md,
  },
  callAction: {
    backgroundColor: COLORS.success,
  },
  callText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: FONT.body,
  },
  viewAction: {
    backgroundColor: COLORS.primarySoft,
  },
  viewText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT.body,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT.title,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: FONT.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
