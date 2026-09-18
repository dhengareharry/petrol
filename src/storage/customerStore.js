import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CUSTOMER_PIN } from '../auth';

const CUSTOMERS_KEY = 'pump_customers_v3';
export const REFERRAL_BONUS_POINTS = 100;

function makeHistoryEntry(type, label, amount) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    label,
    amount,
    date: new Date().toISOString(),
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
      vehicleNumber: 'MH12 AB 1234',
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
      vehicleNumber: 'MH14 CD 5678',
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
      vehicleNumber: '',
      points: 0,
      lifetimePoints: 0,
      joinedDate: daysAgo(1),
      history: [],
    },
  };
}

async function readCustomers() {
  const raw = await AsyncStorage.getItem(CUSTOMERS_KEY);
  if (!raw) {
    const seeded = seedCustomers();
    await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw);
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

export async function createCustomer({ name, phone, vehicleNumber, pin }) {
  const customers = await readCustomers();
  if (customers[phone]) {
    throw new Error('A customer with this phone number already exists.');
  }
  customers[phone] = {
    phone,
    pin: pin && pin.trim() ? pin.trim() : DEFAULT_CUSTOMER_PIN,
    name,
    vehicleNumber: vehicleNumber || '',
    points: 0,
    lifetimePoints: 0,
    joinedDate: new Date().toISOString(),
    history: [],
  };
  await writeCustomers(customers);
  return customers[phone];
}

export async function addPoints(phone, litres) {
  const customers = await readCustomers();
  const customer = customers[phone];
  if (!customer) throw new Error('Customer not found.');

  const amount = Math.round(Number(litres));
  customers[phone] = {
    ...customer,
    points: customer.points + amount,
    lifetimePoints: customer.lifetimePoints + amount,
    history: [makeHistoryEntry('earn', `Fuel purchase: ${amount} ltr`, amount), ...customer.history],
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
export async function finalizeRedemption(phone, reward) {
  const customers = await readCustomers();
  const customer = customers[phone];
  if (!customer) throw new Error('Customer not found.');
  if (customer.points < reward.points) {
    throw new Error('Customer no longer has enough points for this reward.');
  }

  customers[phone] = {
    ...customer,
    points: customer.points - reward.points,
    history: [makeHistoryEntry('redeem', reward.name, reward.points), ...customer.history],
  };
  await writeCustomers(customers);
  return customers[phone];
}
