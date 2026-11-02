// Program rules the screens show and pre-validate with. The server enforces them (and the admin can change them in
// settings), so these only need to match the defaults it was seeded with.

export const REFERRAL_BONUS_POINTS = 100;

// 1 point is earned per litre. Fuel is entered in rupees or litres; this rate converts between the two.
export const FUEL_RATE_PER_LITRE = 100;
export const MIN_FUEL_AMOUNT_RUPEES = 500;
export const MIN_FUEL_LITRES = MIN_FUEL_AMOUNT_RUPEES / FUEL_RATE_PER_LITRE;

export const STAFF_ROLES = ['cashier', 'admin'];
export const MIN_STAFF_PASSWORD_LENGTH = 6;
