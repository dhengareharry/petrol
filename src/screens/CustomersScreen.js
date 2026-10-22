import { useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import VehicleNumberInput from '../components/VehicleNumberInput';
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

export default function CustomersScreen({ customers, onSelect, onCreate }) {
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.vehicles.some((v) => v.number.toLowerCase().replace(/ /g, '').includes(q.replace(/ /g, '')))
    );
  }, [customers, query]);

  async function handleCreate() {
    if (!name.trim() || !/^\d{10}$/.test(phone.trim())) {
      notify('Invalid details', 'Enter a name and a valid 10-digit phone number.');
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
        <Text style={styles.tierIcon}>{current.icon}</Text>
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
          <Text style={styles.addButtonText}>{showForm ? 'Close' : '+ Add'}</Text>
        </Pressable>
      </View>

      {showForm && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Customer name"
            placeholderTextColor={COLORS.textMuted}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="10-digit phone number"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            value={phone}
            onChangeText={setPhone}
          />
          <TextInput
            style={styles.input}
            placeholder="Vehicle model (optional, e.g. Land Cruiser)"
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
        data={filtered}
        keyExtractor={(item) => item.phone}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No customers found.</Text>}
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
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  addButtonText: {
    color: COLORS.textPrimary,
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
