import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from '../components/Icon';
import IconTile from '../components/IconTile';
import LanguageSelector from '../components/LanguageSelector';
import ScreenHeader from '../components/ScreenHeader';
import VehicleNumberInput from '../components/VehicleNumberInput';
import { useI18n } from '../i18n';
import { openPrivacyPolicy } from '../utils/links';
import { VEHICLE_FORMAT_ERROR, isValidVehicleNumber, vehicleLabel } from '../utils/vehicles';
import { COLORS, FONT, RADIUS, SHADOW, SPACING } from '../theme';

function Message({ message }) {
  const { errorText } = useI18n();
  if (!message) return null;
  return (
    <Text style={[styles.message, message.ok ? styles.messageOk : styles.messageError]}>
      {message.ok ? message.text : errorText(message.text)}
    </Text>
  );
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
  onDeleteAccount,
}) {
  const { t } = useI18n();
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

  const [showDelete, setShowDelete] = useState(false);
  const [deletePin, setDeletePin] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState(null);

  function startEdit(vehicle) {
    setVehicleMessage(null);
    setConfirmDeleteId(null);
    setEditing(vehicle ? vehicle.id : 'new');
    setVehicleModel(vehicle ? vehicle.model : '');
    setVehicleNumber(vehicle ? vehicle.number : '');
  }

  function saveName() {
    if (!name.trim()) {
      setNameMessage({ ok: false, text: t('profile.nameRequired') });
      return;
    }
    attempt(() => onUpdateName(customer.phone, name), setNameMessage, t('profile.updated'));
  }

  async function confirmDelete() {
    if (!deletePin.trim()) {
      setDeleteMessage({ ok: false, text: t('profile.currentPinRequired') });
      return;
    }
    setDeleting(true);
    try {
      await onDeleteAccount(deletePin.trim()); // on success the app signs out, so this screen goes away
    } catch (err) {
      setDeleteMessage({ ok: false, text: err.message });
      setDeleting(false);
    }
  }

  async function saveVehicle() {
    if (!isValidVehicleNumber(vehicleNumber)) {
      setVehicleMessage({ ok: false, text: t('vehicle.error') });
      return;
    }
    const input = { model: vehicleModel, number: vehicleNumber };
    const ok = await attempt(
      () => (editing === 'new' ? onAddVehicle(customer.phone, input) : onUpdateVehicle(customer.phone, editing, input)),
      setVehicleMessage,
      editing === 'new' ? t('profile.vehicleAdded') : t('profile.vehicleUpdated')
    );
    if (ok) setEditing(null);
  }

  async function deleteVehicle(id) {
    setConfirmDeleteId(null);
    await attempt(() => onRemoveVehicle(customer.phone, id), setVehicleMessage, t('profile.vehicleRemoved'));
  }

  async function savePin() {
    if (!currentPin) {
      setPinMessage({ ok: false, text: t('profile.currentPinRequired') });
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setPinMessage({ ok: false, text: t('profile.pinDigits') });
      return;
    }
    if (newPin !== confirmPin) {
      setPinMessage({ ok: false, text: t('profile.pinMismatch') });
      return;
    }
    const ok = await attempt(() => onChangePin(customer.phone, currentPin, newPin), setPinMessage, t('profile.pinChanged'));
    if (ok) {
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    }
  }

  const nameChanged = name.trim() !== customer.name;

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('profile.title')} subtitle={`+91 ${customer.phone}`} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('language.title')}</Text>
          <LanguageSelector />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('profile.personal')}</Text>
          <Text style={styles.fieldLabel}>{t('profile.fullName')}</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('profile.fullName')} maxLength={100} />
          <Text style={styles.fieldLabel}>{t('profile.mobile')}</Text>
          <Text style={styles.readonly}>{t('profile.mobileNote', { phone: customer.phone })}</Text>
          <Message message={nameMessage} />
          <Pressable
            style={[styles.primaryButton, !nameChanged && styles.disabled]}
            disabled={!nameChanged}
            onPress={saveName}
          >
            <Text style={styles.primaryButtonText}>{t('profile.save')}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>{t('profile.vehicles')}</Text>
            {editing === null && (
              <Pressable style={styles.addLink} hitSlop={12} onPress={() => startEdit(null)}>
                <Icon name="plus" size={14} color={COLORS.primary} strokeWidth={2.4} />
                <Text style={styles.link}>{t('profile.addVehicle')}</Text>
              </Pressable>
            )}
          </View>

          {customer.vehicles.length === 0 && editing !== 'new' ? (
            <Text style={styles.emptyText}>{t('profile.noVehicles')}</Text>
          ) : null}

          {customer.vehicles.map((v) =>
            editing === v.id ? null : (
              <View key={v.id} style={styles.vehicleRow}>
                <IconTile name="car" size={36} />
                <Text style={styles.vehicleText}>{vehicleLabel(v)}</Text>
                {confirmDeleteId === v.id ? (
                  <View style={styles.rowActions}>
                    <Pressable hitSlop={10} onPress={() => deleteVehicle(v.id)}>
                      <Text style={styles.dangerLink}>{t('profile.confirmDelete')}</Text>
                    </Pressable>
                    <Pressable hitSlop={10} onPress={() => setConfirmDeleteId(null)}>
                      <Text style={styles.link}>{t('common.cancel')}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.rowActions}>
                    <Pressable hitSlop={10} onPress={() => startEdit(v)}>
                      <Text style={styles.link}>{t('profile.edit')}</Text>
                    </Pressable>
                    <Pressable
                      hitSlop={10}
                      onPress={() => {
                        setVehicleMessage(null);
                        setConfirmDeleteId(v.id);
                      }}
                    >
                      <Text style={styles.dangerLink}>{t('profile.delete')}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )
          )}

          {editing !== null && (
            <View style={styles.vehicleForm}>
              <Text style={styles.fieldLabel}>{t('profile.vehicleNumber')}</Text>
              <VehicleNumberInput
                style={styles.input}
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                placeholder={t('profile.vehicleNumberExample')}
              />
              <Text style={styles.fieldLabel}>{t('profile.vehicleModel')}</Text>
              <TextInput
                style={styles.input}
                value={vehicleModel}
                onChangeText={setVehicleModel}
                placeholder={t('profile.vehicleModelExample')}
                maxLength={60}
                placeholderTextColor={COLORS.textMuted}
              />
              <View style={styles.formActions}>
                <Pressable style={[styles.formButton, styles.cancelButton]} onPress={() => setEditing(null)}>
                  <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                </Pressable>
                <Pressable style={[styles.formButton, styles.saveButton]} onPress={saveVehicle}>
                  <Text style={styles.saveText}>{editing === 'new' ? t('profile.addVehicle') : t('profile.saveVehicle')}</Text>
                </Pressable>
              </View>
            </View>
          )}
          <Message message={vehicleMessage?.text === VEHICLE_FORMAT_ERROR ? null : vehicleMessage} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('profile.changePin')}</Text>
          <TextInput
            style={styles.input}
            value={currentPin}
            onChangeText={(t) => setCurrentPin(t.replace(/\D/g, ''))}
            placeholder={t('profile.currentPin')}
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            keyboardType="numeric"
            maxLength={4}
          />
          <TextInput
            style={[styles.input, styles.inputGap]}
            value={newPin}
            onChangeText={(t) => setNewPin(t.replace(/\D/g, ''))}
            placeholder={t('profile.newPin')}
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            keyboardType="numeric"
            maxLength={4}
          />
          <TextInput
            style={[styles.input, styles.inputGap]}
            value={confirmPin}
            onChangeText={(t) => setConfirmPin(t.replace(/\D/g, ''))}
            placeholder={t('profile.confirmPin')}
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            keyboardType="numeric"
            maxLength={4}
          />
          <Message message={pinMessage} />
          <Pressable style={styles.primaryButton} onPress={savePin}>
            <Text style={styles.primaryButtonText}>{t('profile.changePin')}</Text>
          </Pressable>
        </View>

        <View style={[styles.card, styles.dangerCard]}>
          <Text style={styles.sectionTitle}>{t('profile.deleteTitle')}</Text>
          <Text style={styles.readonly}>{t('profile.deleteText')}</Text>
          {showDelete ? (
            <>
              <TextInput
                style={styles.input}
                value={deletePin}
                onChangeText={(text) => {
                  setDeletePin(text.replace(/\D/g, ''));
                  setDeleteMessage(null);
                }}
                placeholder={t('profile.deletePin')}
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={4}
                editable={!deleting}
              />
              <Message message={deleteMessage} />
              <View style={styles.formActions}>
                <Pressable
                  style={[styles.formButton, styles.cancelButton]}
                  disabled={deleting}
                  onPress={() => {
                    setShowDelete(false);
                    setDeletePin('');
                    setDeleteMessage(null);
                  }}
                >
                  <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                </Pressable>
                <Pressable style={[styles.formButton, styles.deleteConfirmButton, deleting && styles.disabled]} disabled={deleting} onPress={confirmDelete}>
                  <Text style={styles.saveText}>{deleting ? t('profile.deleting') : t('profile.deleteConfirm')}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Pressable style={styles.deleteButton} onPress={() => setShowDelete(true)} accessibilityRole="button">
              <Text style={styles.deleteButtonText}>{t('profile.deleteButton')}</Text>
            </Pressable>
          )}
        </View>

        <Pressable style={styles.privacyLink} onPress={openPrivacyPolicy} hitSlop={10} accessibilityRole="link">
          <Text style={styles.link}>{t('profile.privacy')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    ...SHADOW.card,
  },
  addLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
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
    backgroundColor: COLORS.background,
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
  dangerCard: {
    borderWidth: 1,
    borderColor: COLORS.dangerSoft,
  },
  deleteButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    marginTop: SPACING.sm,
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontWeight: '800',
    fontSize: FONT.body,
  },
  deleteConfirmButton: {
    backgroundColor: COLORS.danger,
  },
  privacyLink: {
    alignSelf: 'center',
    paddingVertical: SPACING.md,
  },
});
