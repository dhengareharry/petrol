const EARTH_RADIUS_M = 6371000;
const toRad = (deg) => (deg * Math.PI) / 180;

/** Straight-line distance in metres between two GPS points (haversine). */
export function distanceMeters(a, b) {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "260 m" below a kilometre, "2.5 km" above. */
export function readableDistance(metres) {
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.round(metres)} m`;
}

/**
 * Is a phone's position at the pump? `rules` carries the pump location and the allowed radius (from the server).
 * Until the admin has set the pump's location nothing is checked, and the server makes the same call when the photo is sent.
 * Returns { checked, ok, distance, problem } where `problem` is a message for the person holding the phone.
 */
export function checkAtPump(rules, spot) {
  const { pumpLatitude, pumpLongitude, geofenceMeters } = rules;
  if (pumpLatitude == null || pumpLongitude == null) return { checked: false, ok: true, distance: null, problem: null };

  const distance = Math.round(distanceMeters(spot, { latitude: pumpLatitude, longitude: pumpLongitude }));
  if (distance > geofenceMeters) {
    return {
      checked: true,
      ok: false,
      distance,
      problem: `You are about ${readableDistance(distance)} from the pump. Photos can only be taken within ${geofenceMeters} m of the pump. Move closer and take the photo again.`,
    };
  }
  if (spot.accuracy != null && spot.accuracy > geofenceMeters) {
    return {
      checked: true,
      ok: false,
      distance,
      problem: `The GPS signal is too weak (accurate to only ${readableDistance(spot.accuracy)}) to confirm you are at the pump. Move to open sky and take the photo again.`,
    };
  }
  return { checked: true, ok: true, distance, problem: null };
}
