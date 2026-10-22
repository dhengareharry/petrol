import AsyncStorage from '@react-native-async-storage/async-storage';

const STAFF_KEY = 'pump_staff_v1';

export const STAFF_ROLES = ['cashier', 'admin'];
export const MIN_STAFF_PASSWORD_LENGTH = 6;

// Demo-only: passwords are stored as plain text because there is no backend.
function seedStaff() {
  const now = new Date().toISOString();
  return [
    { id: 'staff-admin', name: 'Administrator', username: 'admin', password: 'admin123', role: 'admin', active: true, createdDate: now },
    { id: 'staff-cashier', name: 'Demo Cashier', username: 'cashier', password: 'cashier123', role: 'cashier', active: true, createdDate: now },
  ];
}

async function readStaff() {
  const raw = await AsyncStorage.getItem(STAFF_KEY);
  if (!raw) {
    const seeded = seedStaff();
    await AsyncStorage.setItem(STAFF_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return seedStaff();
  }
}

async function writeStaff(staff) {
  await AsyncStorage.setItem(STAFF_KEY, JSON.stringify(staff));
}

export async function getAllStaff() {
  const staff = await readStaff();
  return staff.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getStaffById(id) {
  const staff = await readStaff();
  return staff.find((s) => s.id === id) || null;
}

export async function verifyStaffLogin(username, password) {
  const staff = await readStaff();
  const account = staff.find((s) => s.username.toLowerCase() === username.trim().toLowerCase());
  if (!account || account.password !== password) throw new Error('Incorrect username or password.');
  if (!account.active) throw new Error('This account has been disabled. Contact an admin.');
  return account;
}

function validName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) throw new Error('Enter the staff member’s name.');
  return trimmed;
}

function validUsername(username, staff, ignoreId) {
  const trimmed = (username || '').trim();
  if (!/^[a-z0-9._]{3,20}$/i.test(trimmed)) {
    throw new Error('Username must be 3-20 characters: letters, numbers, dot or underscore.');
  }
  if (staff.some((s) => s.id !== ignoreId && s.username.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('That username is already taken.');
  }
  return trimmed;
}

function assertValidPassword(password) {
  if ((password || '').length < MIN_STAFF_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_STAFF_PASSWORD_LENGTH} characters.`);
  }
}

export async function createStaff({ name, username, password, role }) {
  const staff = await readStaff();
  const trimmedName = validName(name);
  const trimmedUsername = validUsername(username, staff);
  assertValidPassword(password);
  if (!STAFF_ROLES.includes(role)) throw new Error('Choose a role.');

  const account = {
    id: `staff-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: trimmedName,
    username: trimmedUsername,
    password,
    role,
    active: true,
    createdDate: new Date().toISOString(),
  };
  await writeStaff([...staff, account]);
  return account;
}

// Admin edit: name and username always; password only when a new one is supplied.
export async function updateStaff(id, { name, username, password }) {
  const staff = await readStaff();
  if (!staff.some((s) => s.id === id)) throw new Error('Staff account not found.');
  const trimmedName = validName(name);
  const trimmedUsername = validUsername(username, staff, id);
  if (password) assertValidPassword(password);

  await writeStaff(
    staff.map((s) =>
      s.id === id ? { ...s, name: trimmedName, username: trimmedUsername, ...(password ? { password } : {}) } : s
    )
  );
}

export async function changeOwnPassword(id, currentPassword, newPassword) {
  const staff = await readStaff();
  const account = staff.find((s) => s.id === id);
  if (!account) throw new Error('Staff account not found.');
  if (account.password !== currentPassword) throw new Error('Current password is incorrect.');
  assertValidPassword(newPassword);
  await writeStaff(staff.map((s) => (s.id === id ? { ...s, password: newPassword } : s)));
}

export async function setStaffActive(id, active, actingStaffId) {
  const staff = await readStaff();
  const target = staff.find((s) => s.id === id);
  if (!target) throw new Error('Staff account not found.');

  if (!active) {
    if (id === actingStaffId) throw new Error('You cannot disable your own account.');
    const otherActiveAdmins = staff.filter((s) => s.role === 'admin' && s.active && s.id !== id);
    if (target.role === 'admin' && otherActiveAdmins.length === 0) {
      throw new Error('At least one active admin is required.');
    }
  }
  await writeStaff(staff.map((s) => (s.id === id ? { ...s, active } : s)));
}
