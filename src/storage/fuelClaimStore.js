import AsyncStorage from '@react-native-async-storage/async-storage';
import { FUEL_RATE_PER_LITRE, MIN_FUEL_AMOUNT_RUPEES, addPoints, getCustomer } from './customerStore';

const CLAIMS_KEY = 'pump_fuel_claims_v1';
const photoKey = (id) => `pump_fuel_photo_${id}`;

async function readClaims() {
  const raw = await AsyncStorage.getItem(CLAIMS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeClaims(claims) {
  await AsyncStorage.setItem(CLAIMS_KEY, JSON.stringify(claims));
}

export async function getAllClaims() {
  const claims = await readClaims();
  return claims.sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
}

// Photos live under their own keys so the claims list stays small to read.
export async function getClaimPhoto(id) {
  return AsyncStorage.getItem(photoKey(id));
}

export async function createClaim({ customerPhone, vehicleId, amountRupees, photoDataUri, location }) {
  const customer = await getCustomer(customerPhone);
  if (!customer) throw new Error('Customer not found.');

  const vehicle = customer.vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) throw new Error('Select the vehicle you fuelled.');

  const amount = Number(amountRupees);
  if (!amount || amount < MIN_FUEL_AMOUNT_RUPEES) {
    throw new Error(`Fuel amount must be at least ₹${MIN_FUEL_AMOUNT_RUPEES} to qualify for reward points.`);
  }
  if (!photoDataUri) throw new Error('A dashboard photo is required.');
  if (!location) throw new Error('Location is required to verify the fuel fill-up.');

  const claims = await readClaims();
  if (claims.some((c) => c.customerPhone === customerPhone && c.status === 'pending')) {
    throw new Error('You already have a fuel upload awaiting approval. Please wait for the cashier to review it.');
  }

  const claim = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    customerPhone,
    customerName: customer.name,
    vehicleId: vehicle.id,
    vehicleModel: vehicle.model,
    vehicleNumber: vehicle.number,
    claimedAmountRupees: amount,
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy ?? null,
    },
    status: 'pending',
    submittedDate: new Date().toISOString(),
    resolvedDate: null,
    approvedAmountRupees: null,
    pointsAwarded: null,
  };

  await AsyncStorage.setItem(photoKey(claim.id), photoDataUri);
  await writeClaims([claim, ...claims]);
  return claim;
}

export async function approveClaim(id, amountRupees, by) {
  const claims = await readClaims();
  const claim = claims.find((c) => c.id === id);
  if (!claim) throw new Error('Fuel claim not found.');
  if (claim.status !== 'pending') throw new Error('This claim has already been resolved.');

  const amount = Number(amountRupees);
  if (!amount || amount < MIN_FUEL_AMOUNT_RUPEES) {
    throw new Error(`Approved amount must be at least ₹${MIN_FUEL_AMOUNT_RUPEES}.`);
  }

  const litres = Math.round(amount / FUEL_RATE_PER_LITRE);
  await addPoints(claim.customerPhone, litres, by);

  const updated = claims.map((c) =>
    c.id === id
      ? {
          ...c,
          status: 'approved',
          approvedAmountRupees: amount,
          pointsAwarded: litres,
          resolvedDate: new Date().toISOString(),
          resolvedBy: by || null,
        }
      : c
  );
  await writeClaims(updated);
  return updated.find((c) => c.id === id);
}

export async function rejectClaim(id, by) {
  const claims = await readClaims();
  const claim = claims.find((c) => c.id === id);
  if (!claim) throw new Error('Fuel claim not found.');
  if (claim.status !== 'pending') throw new Error('This claim has already been resolved.');

  const updated = claims.map((c) =>
    c.id === id ? { ...c, status: 'rejected', resolvedDate: new Date().toISOString(), resolvedBy: by || null } : c
  );
  await writeClaims(updated);
  return updated.find((c) => c.id === id);
}
