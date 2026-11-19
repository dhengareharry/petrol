// Fallback program rules, used until the server's settings have loaded (or when it can't be reached). The server owns the
// real values and admins can change them — screens read them through useRules() (context/RulesContext.js).
export const DEFAULT_RULES = {
  // 1 point is earned per litre. Fuel is entered in rupees or litres; this rate converts between the two.
  fuelRatePerLitre: 100,
  minFuelAmountRupees: 500,
  referralBonusPoints: 100,
  // Where the pump is, and how close to it (metres) a fuel or gift-handover photo must be taken. The location is null until an
  // admin sets it, and nothing is checked until then.
  pumpLatitude: null,
  pumpLongitude: null,
  geofenceMeters: 200,
  // SMS verification is off unless the server says otherwise (GET /settings), so the app never asks for a code it can't get.
  otpEnabled: false,
};

export const STAFF_ROLES = ['cashier', 'admin'];
export const MIN_STAFF_PASSWORD_LENGTH = 6;
