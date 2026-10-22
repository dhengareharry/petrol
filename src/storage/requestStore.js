import AsyncStorage from '@react-native-async-storage/async-storage';
import { finalizeRedemption, getCustomer } from './customerStore';

const REQUESTS_KEY = 'pump_redeem_requests_v1';

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// Past issues for the seeded demo customer, so the admin's issue log has history to show
// (one inside the 45-day window, one outside).
function seedRequests() {
  return [
    {
      id: 'req-seed-1',
      customerPhone: '9876543210',
      customerName: 'Rahul Sharma',
      rewardId: 'sony-home-theater',
      rewardName: 'Sony Home Theater',
      rewardIcon: '🎧',
      points: 3000,
      status: 'approved',
      requestedDate: daysAgo(20),
      resolvedDate: daysAgo(20),
      resolvedBy: 'Administrator',
    },
    {
      id: 'req-seed-2',
      customerPhone: '9876543210',
      customerName: 'Rahul Sharma',
      rewardId: 'smart-watch',
      rewardName: 'Smart Watch',
      rewardIcon: '⌚',
      points: 1750,
      status: 'approved',
      requestedDate: daysAgo(60),
      resolvedDate: daysAgo(60),
      resolvedBy: 'Demo Cashier',
    },
  ];
}

async function readRequests() {
  const raw = await AsyncStorage.getItem(REQUESTS_KEY);
  if (!raw) {
    const seeded = seedRequests();
    await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeRequests(requests) {
  await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  return requests;
}

export async function getAllRequests() {
  const requests = await readRequests();
  return requests.sort((a, b) => new Date(b.requestedDate) - new Date(a.requestedDate));
}

export async function getPendingPointsForCustomer(phone) {
  const requests = await readRequests();
  return requests
    .filter((r) => r.customerPhone === phone && r.status === 'pending')
    .reduce((sum, r) => sum + r.points, 0);
}

export async function createRequest(phone, reward) {
  const customer = await getCustomer(phone);
  if (!customer) throw new Error('Customer not found.');

  const requests = await readRequests();
  const alreadyPending = requests.some(
    (r) => r.customerPhone === phone && r.rewardId === reward.id && r.status === 'pending'
  );
  if (alreadyPending) {
    throw new Error('You already have a pending request for this reward.');
  }

  const pendingPoints = requests
    .filter((r) => r.customerPhone === phone && r.status === 'pending')
    .reduce((sum, r) => sum + r.points, 0);

  if (customer.points - pendingPoints < reward.points) {
    throw new Error('Not enough available points for this reward.');
  }

  const request = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    customerPhone: phone,
    customerName: customer.name,
    rewardId: reward.id,
    rewardName: reward.name,
    rewardIcon: reward.icon,
    points: reward.points,
    status: 'pending',
    requestedDate: new Date().toISOString(),
    resolvedDate: null,
  };

  await writeRequests([request, ...requests]);
  return request;
}

export async function approveRequest(id, by) {
  const requests = await readRequests();
  const request = requests.find((r) => r.id === id);
  if (!request) throw new Error('Request not found.');
  if (request.status !== 'pending') throw new Error('This request has already been resolved.');

  await finalizeRedemption(request.customerPhone, {
    id: request.rewardId,
    name: request.rewardName,
    points: request.points,
  }, by);

  const updated = requests.map((r) =>
    r.id === id ? { ...r, status: 'approved', resolvedDate: new Date().toISOString(), resolvedBy: by || null } : r
  );
  await writeRequests(updated);
  return updated.find((r) => r.id === id);
}

export async function rejectRequest(id, by) {
  const requests = await readRequests();
  const request = requests.find((r) => r.id === id);
  if (!request) throw new Error('Request not found.');
  if (request.status !== 'pending') throw new Error('This request has already been resolved.');

  const updated = requests.map((r) =>
    r.id === id ? { ...r, status: 'rejected', resolvedDate: new Date().toISOString(), resolvedBy: by || null } : r
  );
  await writeRequests(updated);
  return updated.find((r) => r.id === id);
}
