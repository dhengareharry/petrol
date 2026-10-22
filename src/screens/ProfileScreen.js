import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import VehicleNumberInput from '../components/VehicleNumberInput';
import { VEHICLE_FORMAT_ERROR, vehicleLabel } from '../utils/vehicles';
import { COLORS, FONT, RADIUS, SPACING } from '../theme';

function Message({ message }) {
  if (!message) return null;
  return <Text style={[styles.message, message.ok ? styles.messageOk : styles.messageError]}>{message.text}</Text>;
}

async function attempt(action, setMessage, okText) {
  try {
    await action();
    setMessage({ ok: true, text: okText });
    return true;
  } catch (err) {
    setMessage({ ok: false, text: err.message });
    return false;
  }
}

export default function ProfileScreen({
  customer,
  onUpdateName,
  onChangePin,
  onAddVehicle,
  onUpdateVehicle,
  onRemoveVehicle,
}) {
  const [name, setName] = useState(customer.name);
  const [nameMessage, setNameMessage] = useState(null);

  const [editing, setEditing] = useState(null); // null | 'new' | vehicle id
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [vehicleMessage, setVehicleMessage] = useState(null);

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState(null);

  function startEdit(vehicle) {
    setVehicleMessage(null);
    setConfirmDeleteId(null);
    setEditing(vehicle ? vehicle.id : 'new');
    setVehicleModel(vehicle ? vehicle.model : '');
    setVehicleNumber(vehicle ? vehicle.number : '');
  }

  async function saveVehicle() {
    const input = { model: vehicleModel, number: vehicleNumber };
    const ok = await attempt(
      () => (editing === 'new' ? onAddVehicle(customer.phone, input) : onUpdateVehicle(customer.phone, editing, input)),
      setVehicleMessage,
      editing === 'new' ? 'Vehicle added.' : 'Vehicle updated.'
    );
    if (ok) setEditing(null);
  }

  async function deleteVehicle(id) {
    setConfirmDeleteId(null);
    await attempt(() => onRemoveVehicle(customer.phone, id), setVehicleMessage, 'Vehicle removed.');
  }

  async function savePin() {
    if (newPin !== confirmPin) {
      setPinMessage({ ok: false, text: 'New PIN and confirmation do not match.' });
      return;
    }
    const ok = await attempt(() => onChangePin(customer.phone, currentPin, newPin), setPinMessage, 'PIN changed.');
    if (ok) {
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    }
  }

  const nameChanged = name.trim() !== customer.name;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <Text style={styles.headerSubtitle}>{customer.phone}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal details</Text>
          <Text style={styles.fieldLabel}>Full name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" />
          <Text style={styles.fieldLabel}>Mobile number</Text>
          <Text style={styles.readonly}>{customer.phone} (cannot be changed — it is your login and referral code)</Text>
          <Message message={nameMessage} />
          <Pressable
            style={[styles.primaryButton, !nameChanged && styles.disabled]}
            disabled={!nameChanged}
            onPress={() => attempt(() => onUpdateName(customer.phone, name), setNameMessage, 'Profile updated.')}
          >
            <Text style={styles.primaryButtonText}>Save changes</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>My vehicles</Text>
            {editing === null && (
              <Pressable onPress={() => startEdit(null)}>
                <Text style={styles.link}>+ Add vehicle</Text>
              </Pressable>
            )}
          </View>

          {customer.vehicles.length === 0 && editing !== 'new' ? (
            <Text style={styles.emptyText}>No vehicles yet. Add one to start uploading fuel proofs.</Text>
          ) : null}

          {customer.vehicles.map((v) =>
            editing === v.id ? null : (
              <View key={v.id} style={styles.vehicleRow}>
                <Text style={styles.vehicleIcon}>🚗</Text>
                <Text style={styles.vehicleText}>{vehicleLabel(v)}</Text>
                {confirmDeleteId === v.id ? (
                  <View style={styles.rowActions}>
                    <Pressable onPress={() => deleteVehicle(v.id)}>
                      <Text style={styles.dangerLink}>Confirm delete</Text>
                    </Pressable>
                    <Pressable onPress={() => setConfirmDeleteId(null)}>
                      <Text style={styles.link}>Cancel</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.rowActions}>
                    <Pressable onPress={() => startEdit(v)}>
                      <Text style={styles.link}>Edit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setVehicleMessage(null);
                        setConfirmDeleteId(v.id);
                      }}
                    >
                      <Text style={styles.dangerLink}>Delete</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )
          )}

          {editing !== null && (
            <View style={styles.vehicleForm}>
              <Text style={styles.fieldLabel}>Vehicle number *</Text>
              <VehicleNumberInput
                style={styles.input}
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                placeholder="e.g. MH 40 CF 4200"
              />
              <Text style={styles.fieldLabel}>Vehicle model (optional)</Text>
              <TextInput
                style={styles.input}
                value={vehicleModel}
                onChangeText={setVehicleModel}
                placeholder="e.g. Land Cruiser"
                placeholderTextColor={COLORS.textMuted}
              />
              <View style={styles.formActions}>
                <Pressable style={[styles.formButton, styles.cancelButton]} onPress={() => setEditing(null)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.formButton, styles.saveButton]} onPress={saveVehicle}>
                  <Text style={styles.saveText}>{editing === 'new' ? 'Add vehicle' : 'Save vehicle'}</Text>
                </Pressable>
              </View>
            </View>
          )}
          <Message message={vehicleMessage?.text === VEHICLE_FORMAT_ERROR ? null : vehicleMessage} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Change PIN</Text>
          <TextInput
            style={styles.input}
            value={currentPin}
            onChangeText={setCurrentPin}
            placeholder="Current PIN"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            keyboardType="numeric"
            maxLength={4}
          />
          <TextInput
            style={[styles.input, styles.inputGap]}
            value={newPin}
            onChangeText={setNewPin}
            placeholder="New 4-digit PIN"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            keyboardType="numeric"
            maxLength={4}
          />
          <TextInput
            style={[styles.input, styles.inputGap]}
            value={confirmPin}
            onChangeText={setConfirmPin}
            placeholder="Confirm new PIN"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            keyboardType="numeric"
            maxLength={4}
          />
          <Message message={pinMessage} />
          <Pressable style={styles.primaryButton} onPress={savePin}>
            <Text style={styles.primaryButtonText}>Change PIN</Text>
          </Pressable>
        </View>
      </ScrollView>
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
  },
  headerTitle: {
    color: COLORS.textOnPrimary,
    fontSize: FONT.title,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: COLORS.textOnPrimaryMuted,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FONT.label,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  readonly: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT.body,
    color: COLORS.textPrimary,
  },
  inputGap: {
    marginTop: SPACING.sm,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  primaryButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: FONT.body,
  },
  disabled: {
    opacity: 0.5,
  },
  message: {
    fontSize: 12,
    marginTop: SPACING.sm,
  },
  messageOk: {
    color: COLORS.success,
    fontWeight: '600',
  },
  messageError: {
    color: COLORS.danger,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  link: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  dangerLink: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 12,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  vehicleIcon: {
    fontSize: 20,
  },
  vehicleText: {
    flex: 1,
    fontSize: FONT.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  rowActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  vehicleForm: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  formActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  formButton: {
    flex: 1,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: COLORS.success,
  },
  saveText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
});
