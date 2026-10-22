import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CUSTOMER_PIN } from '../auth';
import { VEHICLE_FORMAT_ERROR, compactVehicleNumber, formatVehicleNumber } from '../utils/vehicles';

const CUSTOMERS_KEY = 'pump_customers_v3';
export const REFERRAL_BONUS_POINTS = 100;

// 1 point is earned per litre. Employees enter fuel fill-ups in rupees or
// litres; this rate converts between the two. Adjust to match actual pump pricing.
export const FUEL_RATE_PER_LITRE = 100;
export const MIN_FUEL_AMOUNT_RUPEES = 500;
export const MIN_FUEL_LITRES = MIN_FUEL_AMOUNT_RUPEES / FUEL_RATE_PER_LITRE;

function makeHistoryEntry(type, label, amount, by) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    label,
    amount,
    date: new Date().toISOString(),
    ...(by ? { by } : {}),
  };
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function seedCustomers() {
  return {
    '9876543210': {
      phone: '9876543210',
      pin: DEFAULT_CUSTOMER_PIN,
      name: 'Rahul Sharma',
      vehicles: [
        { id: 'veh-seed-1', model: 'Maruti Swift', number: 'MH12 AB 1234' },
        { id: 'veh-seed-2', model: 'Hyundai Creta', number: 'MH12 XY 7788' },
      ],
      points: 18500,
      lifetimePoints: 32500,
      joinedDate: daysAgo(210),
      history: [
        { id: 'seed-1', type: 'earn', label: 'Fuel purchase: 2500 ltr', amount: 2500, date: daysAgo(3) },
        { id: 'seed-2', type: 'redeem', label: 'Sony Home Theater', amount: 3000, date: daysAgo(20) },
        { id: 'seed-3', type: 'redeem', label: 'Smart Watch', amount: 1750, date: daysAgo(60) },
        { id: 'seed-4', type: 'earn', label: 'Fuel purchase: 5000 ltr', amount: 5000, date: daysAgo(90) },
        { id: 'seed-5', type: 'earn', label: 'Fuel purchase: 10000 ltr', amount: 10000, date: daysAgo(150) },
      ],
    },
    '9123456780': {
      phone: '9123456780',
      pin: DEFAULT_CUSTOMER_PIN,
      name: 'Priya Verma',
      vehicles: [{ id: 'veh-seed-3', model: 'Honda City', number: 'MH14 CD 5678' }],
      points: 3200,
      lifetimePoints: 3200,
      joinedDate: daysAgo(45),
      history: [
        { id: 'seed-6', type: 'earn', label: 'Fuel purchase: 1200 ltr', amount: 1200, date: daysAgo(5) },
        { id: 'seed-7', type: 'earn', label: 'Fuel purchase: 2000 ltr', amount: 2000, date: daysAgo(30) },
      ],
    },
    '9999999999': {
      phone: '9999999999',
      pin: DEFAULT_CUSTOMER_PIN,
      name: 'Demo Customer',
      vehicles: [],
      points: 0,
      lifetimePoints: 0,
      joinedDate: daysAgo(1),
      history: [],
    },
  };
}

function makeVehicle(model, number) {
  return {
    id: `veh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    model: (model || '').trim(),
    // Legacy numbers saved before format validation are kept as typed; new ones are validated first.
    number: formatVehicleNumber(number) ?? normalizeVehicleNumber(number),
  };
}

function normalizeVehicleNumber(number) {
  return (number || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

// Customers saved before multi-vehicle support carry vehicleModel/vehicleNumber; fold them into `vehicles`.
function migrateCustomer(customer) {
  if (Array.isArray(customer.vehicles)) return customer;
  const { vehicleModel, vehicleNumber, ...rest } = customer;
  return { ...rest, vehicles: vehicleModel || vehicleNumber ? [makeVehicle(vehicleModel, vehicleNumber)] : [] };
}

async function readCustomers() {
  const raw = await AsyncStorage.getItem(CUSTOMERS_KEY);
  if (!raw) {
    const seeded = seedCustomers();
    await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw);
    const migrated = {};
    let changed = false;
    Object.keys(parsed).forEach((phone) => {
      migrated[phone] = migrateCustomer(parsed[phone]);
      if (migrated[phone] !== parsed[phone]) changed = true;
    });
    if (changed) await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return seedCustomers();
  }
}

async function writeCustomers(customers) {
  await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  return customers;
}

export async function getAllCustomers() {
  const customers = await readCustomers();
  return Object.values(customers).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCustomer(phone) {
  const customers = await readCustomers();
  return customers[phone] || null;
}

export async function verifyCustomerLogin(phone, pin) {
  const customer = await getCustomer(phone);
  if (!customer) throw new Error('No account found for this phone number.');
  if (customer.pin !== pin) throw new Error('Incorrect PIN.');
  return customer;
}

export async function createCustomer({ name, phone, vehicleNumber, vehicleModel, pin }) {
  const customers = await readCustomers();
  if (customers[phone]) {
    throw new Error('A customer with this phone number already exists.');
  }
  const hasVehicleNumber = Boolean(normalizeVehicleNumber(vehicleNumber));
  if (vehicleModel && !hasVehicleNumber) {
    throw new Error('Enter the vehicle number along with the vehicle model.');
  }
  if (hasVehicleNumber && !formatVehicleNumber(vehicleNumber)) {
    throw new Error(VEHICLE_FORMAT_ERROR);
  }
  customers[phone] = {
    phone,
    pin: pin && pin.trim() ? pin.trim() : DEFAULT_CUSTOMER_PIN,
    name,
    vehicles: hasVehicleNumber ? [makeVehicle(vehicleModel, vehicleNumber)] : [],
    points: 0,
    lifetimePoints: 0,
    joinedDate: new Date().toISOString(),
    history: [],
  };
  await writeCustomers(customers);
  return customers[phone];
}

async function updateCustomer(phone, apply) {
  const customers = await readCustomers();
  const customer = customers[phone];
  if (!customer) throw new Error('Customer not found.');
  customers[phone] = apply(customer);
  await writeCustomers(customers);
  return customers[phone];
}

export async function updateProfileName(phone, name) {
  const trimmed = (name || '').trim();
  if (!trimmed) throw new Error('Name cannot be empty.');
  return updateCustomer(phone, (c) => ({ ...c, name: trimmed }));
}

export async function changePin(phone, currentPin, newPin) {
  return updateCustomer(phone, (c) => {
    if (c.pin !== currentPin) throw new Error('Current PIN is incorrect.');
    if (!/^\d{4}$/.test(newPin)) throw new Error('New PIN must be 4 digits.');
    return { ...c, pin: newPin };
  });
}

function assertVehicleValid(customer, number, ignoreId) {
  if (!normalizeVehicleNumber(number)) throw new Error('Vehicle number is required.');
  if (!formatVehicleNumber(number)) throw new Error(VEHICLE_FORMAT_ERROR);
  const duplicate = customer.vehicles.some(
    (v) => v.id !== ignoreId && compactVehicleNumber(v.number) === compactVehicleNumber(number)
  );
  if (duplicate) throw new Error('This vehicle number is already on your profile.');
}

export async function addVehicle(phone, { model, number }) {
  return updateCustomer(phone, (c) => {
    assertVehicleValid(c, number);
    return { ...c, vehicles: [...c.vehicles, makeVehicle(model, number)] };
  });
}

export async function updateVehicle(phone, vehicleId, { model, number }) {
  return updateCustomer(phone, (c) => {
    assertVehicleValid(c, number, vehicleId);
    return {
      ...c,
      vehicles: c.vehicles.map((v) =>
        v.id === vehicleId ? { ...v, model: (model || '').trim(), number: formatVehicleNumber(number) } : v
      ),
    };
  });
}

export async function removeVehicle(phone, vehicleId) {
  return updateCustomer(phone, (c) => ({ ...c, vehicles: c.vehicles.filter((v) => v.id !== vehicleId) }));
}

export async function addPoints(phone, litres, by) {
  const customers = await readCustomers();
  const customer = customers[phone];
  if (!customer) throw new Error('Customer not found.');

  const amount = Math.round(Number(litres));
  if (!amount || amount < MIN_FUEL_LITRES) {
    throw new Error(
      `Fuel entry must be at least ₹${MIN_FUEL_AMOUNT_RUPEES} (${MIN_FUEL_LITRES} ltr) to qualify for reward points.`
    );
  }

  customers[phone] = {
    ...customer,
    points: customer.points + amount,
    lifetimePoints: customer.lifetimePoints + amount,
    history: [makeHistoryEntry('earn', `Fuel purchase: ${amount} ltr`, amount, by), ...customer.history],
  };
  await writeCustomers(customers);
  return customers[phone];
}

// Credited to the referrer once the friend they referred finishes signing up.
export async function addReferralBonus(phone, referredName) {
  const customers = await readCustomers();
  const customer = customers[phone];
  if (!customer) throw new Error('Referrer not found.');

  customers[phone] = {
    ...customer,
    points: customer.points + REFERRAL_BONUS_POINTS,
    lifetimePoints: customer.lifetimePoints + REFERRAL_BONUS_POINTS,
    history: [
      makeHistoryEntry('earn', `Referral bonus: ${referredName} joined using your code`, REFERRAL_BONUS_POINTS),
      ...customer.history,
    ],
  };
  await writeCustomers(customers);
  return customers[phone];
}

// Deducts points and logs the redemption in history. Only called once a
// redemption request has been approved (see requestStore.js) — customers
// cannot call this directly, they can only request.
export async function finalizeRedemption(phone, reward, by) {
  const customers = await readCustomers();
  const customer = customers[phone];
  if (!customer) throw new Error('Customer not found.');
  if (customer.points < reward.points) {
    throw new Error('Customer no longer has enough points for this reward.');
  }

  customers[phone] = {
    ...customer,
    points: customer.points - reward.points,
    history: [makeHistoryEntry('redeem', reward.name, reward.points, by), ...customer.history],
  };
  await writeCustomers(customers);
  return customers[phone];
}
