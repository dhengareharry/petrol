export function vehicleLabel(vehicle) {
  return [vehicle.model, vehicle.number].filter(Boolean).join(' · ');
}

export function vehicleSummary(customer) {
  return customer.vehicles.map(vehicleLabel).join(' | ');
}

export const VEHICLE_FORMAT_HINT = 'e.g. MH 36 AD 2861, MH 48 D 9886 or 22 BH 8667 CD';
export const VEHICLE_FORMAT_ERROR = `Enter a valid vehicle number, ${VEHICLE_FORMAT_HINT}.`;

const STATE_CODES = new Set(
  (
    'AN AP AR AS BR CG CH CT DD DL DN GA GJ HP HR JH JK KA KL LA LD MH ML MN MP MZ NL OD OR PB PY RJ SK TG TN TR TS UA UK UP WB'
  ).split(' ')
);

// Standard plate: state(2 letters) + RTO(2 digits) + series(1-3 letters) + number(4 digits).
const STANDARD = /^([A-Z]{2})(\d{2})([A-Z]{1,3})(\d{4})$/;
// Bharat series plate: year(2 digits) + BH + number(4 digits) + series(1-2 letters).
const BHARAT = /^(\d{2})BH(\d{4})([A-Z]{1,2})$/;

export function compactVehicleNumber(input) {
  return (input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Returns the number in standard spaced form ("MH 36 AD 2861"), or null if it is not a valid plate.
export function formatVehicleNumber(input) {
  const compact = compactVehicleNumber(input);

  const standard = compact.match(STANDARD);
  if (standard && STATE_CODES.has(standard[1]) && standard[2] !== '00' && standard[4] !== '0000') {
    return `${standard[1]} ${standard[2]} ${standard[3]} ${standard[4]}`;
  }

  const bharat = compact.match(BHARAT);
  if (bharat && Number(bharat[1]) >= 21 && bharat[2] !== '0000') {
    return `${bharat[1]} BH ${bharat[2]} ${bharat[3]}`;
  }

  return null;
}

export function isValidVehicleNumber(input) {
  return formatVehicleNumber(input) !== null;
}

// Keeps only what a plate can contain while typing: letters, digits and single spaces.
export function sanitizeVehicleInput(text) {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 14);
}
