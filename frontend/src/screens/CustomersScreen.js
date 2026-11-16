import { useEffect, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import usePagedList from '../api/usePagedList';
import Icon from '../components/Icon';
import ListFooter from '../components/ListFooter';
import TierIcon from '../components/TierIcon';
import VehicleNumberInput from '../components/VehicleNumberInput';
import { useI18n } from '../i18n';
import { cleanPhoneInput, isValidMobile, mobileHint } from '../utils/phone';
import { getTierInfo } from '../utils/tiers';
import { vehicleSummary } from '../utils/vehicles';
import { COLORS, FONT, RADIUS, SPACING } from '../theme';

function notify(title, message) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export default function CustomersScreen({ fetchCustomers, reloadKey, onSelect, onCreate }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Search runs on the server (name, phone or vehicle number) and results arrive a page at a time.
  const [searchText, setSearchText] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearchText(query), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const list = usePagedList((page) => fetchCustomers({ search: searchText, page }), [searchText, reloadKey]);

  async function handleCreate() {
    if (!name.trim() || !isValidMobile(phone.trim())) {
      notify('Invalid details', 'Enter a name and a valid 10-digit mobile number (it starts with 6, 7, 8 or 9).');
      return;
    }
    setSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        phone: phone.trim(),
        vehicleModel: vehicleModel.trim(),
        vehicleNumber: vehicleNumber.trim(),
      });
      setName('');
      setPhone('');
      setVehicleModel('');
      setVehicleNumber('');
      setShowForm(false);
    } catch (err) {
      notify('Could not add customer', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function renderItem({ item }) {
    const { current } = getTierInfo(item.lifetimePoints);
    return (
      <Pressable style={styles.row} onPress={() => onSelect(item.phone)}>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customers</Text>
        <Pressable style={styles.addButton} onPress={() => setShowForm((v) => !v)}>
          <Icon name={showForm ? 'x' : 'plus'} size={14} color={COLORS.textOnPrimary} strokeWidth={2.6} />
          <Text style={styles.addButtonText}>{showForm ? 'Close' : 'Add'}</Text>
        </Pressable>
      </View>

      {showForm && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Customer name"
            maxLength={100}
            placeholderTextColor={COLORS.textMuted}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile number"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            onChangeText={(text) => setPhone(cleanPhoneInput(text))}
          />
          {mobileHint(phone, t) ? <Text style={styles.phoneHint}>{mobileHint(phone, t)}</Text> : null}
          {isValidMobile(phone) ? (
            <View style={styles.phoneOkRow}>
              <Icon name="check" size={13} color={COLORS.success} strokeWidth={2.6} />
              <Text style={styles.phoneOk}>Valid mobile number</Text>
            </View>
          ) : null}
          <TextInput
            style={styles.input}
            placeholder="Vehicle model (optional, e.g. Land Cruiser)"
            maxLength={60}
            placeholderTextColor={COLORS.textMuted}
            value={vehicleModel}
            onChangeText={setVehicleModel}
          />
          <VehicleNumberInput
            style={styles.input}
            placeholder="Vehicle number (optional)"
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
          />
          <Pressable
            style={[styles.saveButton, submitting && styles.disabled]}
            disabled={submitting}
            onPress={handleCreate}
          >
            <Text style={styles.saveButtonText}>{submitting ? 'Saving…' : 'Save Customer'}</Text>
          </Pressable>
        </View>
      )}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.textOnPrimary,
    fontSize: FONT.title,
    fontWeight: '800',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  addButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  form: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT.body,
    color: COLORS.textPrimary,
  },
  saveButton: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  saveButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: FONT.body,
  },
  disabled: {
    opacity: 0.6,
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
  phoneHint: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  phoneOkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  phoneOk: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
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
