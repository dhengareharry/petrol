import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MIN_STAFF_PASSWORD_LENGTH, STAFF_ROLES } from '../../storage/staffStore';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';

const ROLE_LABEL = { admin: 'Admin', cashier: 'Cashier' };

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

function StaffRow({ account, isSelf, onUpdate, onSetActive }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(account.name);
  const [username, setUsername] = useState(account.username);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);

  function startEdit() {
    setName(account.name);
    setUsername(account.username);
    setPassword('');
    setMessage(null);
    setEditing(true);
  }

  async function saveEdit() {
    const ok = await attempt(() => onUpdate(account.id, { name, username, password }), setMessage, 'Account updated.');
    if (ok) setEditing(false);
  }

  return (
    <View style={[styles.row, !account.active && styles.rowDisabled]}>
      <View style={styles.rowTop}>
        <View style={styles.rowText}>
          <Text style={styles.rowName}>
            {account.name}
            {isSelf ? ' (you)' : ''}
          </Text>
          <Text style={styles.rowUsername}>@{account.username}</Text>
        </View>
        <Text style={[styles.badge, account.role === 'admin' ? styles.badgeAdmin : styles.badgeCashier]}>
          {ROLE_LABEL[account.role]}
        </Text>
        {!account.active && <Text style={[styles.badge, styles.badgeOff]}>Disabled</Text>}
      </View>

      {editing ? (
        <View style={styles.resetBox}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor={COLORS.textMuted}
          />
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={`New password (leave blank to keep, min ${MIN_STAFF_PASSWORD_LENGTH})`}
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
          />
          <View style={styles.actions}>
            <Pressable onPress={() => setEditing(false)}>
              <Text style={styles.link}>Cancel</Text>
            </Pressable>
            <Pressable onPress={saveEdit}>
              <Text style={styles.link}>Save changes</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable onPress={startEdit}>
            <Text style={styles.link}>Edit</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              attempt(() => onSetActive(account.id, !account.active), setMessage, account.active ? 'Account disabled.' : 'Account enabled.')
            }
          >
            <Text style={account.active ? styles.dangerLink : styles.link}>{account.active ? 'Disable' : 'Enable'}</Text>
          </Pressable>
        </View>
      )}
      <Message message={message} />
    </View>
  );
}

export default function StaffScreen({ staffList, currentStaffId, onCreate, onUpdate, onSetActive }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('cashier');
  const [message, setMessage] = useState(null);

  async function create() {
    const ok = await attempt(() => onCreate({ name, username, password, role }), setMessage, 'Staff account created.');
    if (ok) {
      setName('');
      setUsername('');
      setPassword('');
      setRole('cashier');
      setShowForm(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Staff</Text>
          <Text style={styles.headerSubtitle}>Cashier and admin accounts</Text>
        </View>
        <Pressable
          style={styles.addButton}
          onPress={() => {
            setMessage(null);
            setShowForm((v) => !v);
          }}
        >
          <Text style={styles.addButtonText}>{showForm ? 'Close' : '+ Add'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {showForm && (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={COLORS.textMuted}
            />
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username (letters, numbers, . _)"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={`Temporary password (min ${MIN_STAFF_PASSWORD_LENGTH} characters)`}
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
            />
            <View style={styles.roleRow}>
              {STAFF_ROLES.map((r) => (
                <Pressable key={r} style={[styles.roleChip, role === r && styles.roleChipActive]} onPress={() => setRole(r)}>
                  <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>{ROLE_LABEL[r]}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.roleHelp}>
              {role === 'cashier'
                ? 'Cashiers can record fuel, review fuel proofs and redeem requests, and manage customers.'
                : 'Admins manage the program (dashboard, staff, approvals) but cannot record fuel entries.'}
            </Text>
            <Pressable style={styles.saveButton} onPress={create}>
              <Text style={styles.saveButtonText}>Create account</Text>
            </Pressable>
          </View>
        )}
        <Message message={message} />

        {staffList.map((account) => (
          <StaffRow
            key={account.id}
            account={account}
            isSelf={account.id === currentStaffId}
            onUpdate={onUpdate}
            onSetActive={(id, active) => onSetActive(id, active, currentStaffId)}
          />
        ))}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
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
  roleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  roleChip: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  roleChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  roleChipTextActive: {
    color: COLORS.textOnPrimary,
  },
  roleHelp: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  saveButton: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.textOnPrimary,
    fontWeight: '700',
    fontSize: FONT.body,
  },
  message: {
    fontSize: 12,
  },
  messageOk: {
    color: COLORS.success,
    fontWeight: '600',
  },
  messageError: {
    color: COLORS.danger,
  },
  row: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  rowDisabled: {
    opacity: 0.6,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rowText: {
    flex: 1,
  },
  rowName: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  rowUsername: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    overflow: 'hidden',
  },
  badgeAdmin: {
    backgroundColor: '#E0E7FF',
    color: '#3730A3',
  },
  badgeCashier: {
    backgroundColor: '#DCFCE7',
    color: COLORS.success,
  },
  badgeOff: {
    backgroundColor: '#FEE2E2',
    color: COLORS.danger,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  resetBox: {
    gap: SPACING.sm,
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
});
