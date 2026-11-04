import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import usePagedList from '../../api/usePagedList';
import ListFooter from '../../components/ListFooter';
import TierIcon from '../../components/TierIcon';
import { getTierInfo } from '../../utils/tiers';
import { vehicleSummary } from '../../utils/vehicles';
import FuelEntryForm from './FuelEntryForm';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';

export default function FuelFillingScreen({ fetchCustomers, reloadKey, onCreditPoints, getCustomerByPhone }) {
  const [query, setQuery] = useState('');
  const [selectedPhone, setSelectedPhone] = useState(null);

  // Search runs on the server (name, phone or vehicle number) and results arrive a page at a time.
  const [searchText, setSearchText] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearchText(query), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const list = usePagedList((page) => fetchCustomers({ search: searchText, page }), [searchText, reloadKey]);

  const selectedCustomer = selectedPhone ? getCustomerByPhone(selectedPhone) : null;

  function renderItem({ item }) {
    const { current } = getTierInfo(item.lifetimePoints);
    return (
      <Pressable style={styles.row} onPress={() => setSelectedPhone(item.phone)}>
        <TierIcon tier={current} size={40} />
        <View style={styles.rowText}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.phone}>
            {item.phone}
            {item.vehicles.length ? ` · ${vehicleSummary(item)}` : ''}
          </Text>
        </View>
        <Text style={styles.points}>{item.points.toLocaleString()} pts</Text>
      </Pressable>
    );
  }

  if (selectedCustomer) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setSelectedPhone(null)}>
            <Text style={styles.backText}>‹ Change customer</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Fuel Filling</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.customerCard}>
            <Text style={styles.customerName}>{selectedCustomer.name}</Text>
            <Text style={styles.customerLine}>
              {selectedCustomer.phone}
              {selectedCustomer.vehicles.length ? ` · ${vehicleSummary(selectedCustomer)}` : ''}
            </Text>
            <Text style={styles.customerBalance}>{selectedCustomer.points.toLocaleString()} pts balance</Text>
          </View>

          <FuelEntryForm customer={selectedCustomer} onCreditPoints={onCreditPoints} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fuel Filling</Text>
        <Text style={styles.headerSubtitle}>Select a customer by name or mobile number</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search by name, phone or vehicle no."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        data={list.items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        ListEmptyComponent={list.loading ? null : <Text style={styles.emptyText}>No customers found.</Text>}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          <ListFooter
            loading={list.loading}
            loadingMore={list.loadingMore}
            hasMore={list.hasMore}
            error={list.error}
            hasItems={list.items.length > 0}
            onLoadMore={list.loadMore}
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  backText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
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
  content: {
    padding: SPACING.lg,
  },
  customerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  customerName: {
    fontSize: FONT.title,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  customerLine: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  customerBalance: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  searchWrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  search: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT.body,
    color: COLORS.textPrimary,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  tierIcon: {
    fontSize: 26,
  },
  rowText: {
    flex: 1,
  },
  name: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  phone: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  points: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: SPACING.xxl,
  },
});
