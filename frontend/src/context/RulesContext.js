import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import { DEFAULT_RULES } from '../rules';

const RulesContext = createContext(null);

// How often the app re-reads the program rules, so a change an admin makes reaches everyone without a restart.
const REFRESH_MS = 60000;

const withDerived = (rules) => ({ ...rules, minFuelLitres: rules.minFuelAmountRupees / rules.fuelRatePerLitre });

// The rules as the server sends them (GET and PATCH /settings share the shape).
const fromServer = (s) =>
  withDerived({
    fuelRatePerLitre: s.fuelRatePerLitre,
    minFuelAmountRupees: s.minFuelAmountRupees,
    referralBonusPoints: s.referralBonusPoints,
    pumpLatitude: s.pumpLatitude ?? null,
    pumpLongitude: s.pumpLongitude ?? null,
    geofenceMeters: s.geofenceMeters ?? DEFAULT_RULES.geofenceMeters,
    otpEnabled: s.otpEnabled === true,
  });

/** The program rules (₹ per litre, minimum fill-up, referral bonus). The server owns them; admins can change them. */
export function RulesProvider({ children }) {
  const [rules, setRules] = useState(() => withDerived(DEFAULT_RULES));

  const refresh = useCallback(async () => {
    try {
      const latest = await apiRequest('/settings', { authenticated: false });
      setRules(fromServer(latest));
    } catch {
      // offline or the server is down: keep showing the last known rules
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  // Admin only (the server enforces it). Resolves once the new rules are saved and in effect.
  const save = useCallback(async (changes) => {
    const saved = await apiRequest('/settings', { method: 'PATCH', body: changes });
    setRules(fromServer(saved));
  }, []);

  const value = useMemo(() => ({ ...rules, refresh, save }), [rules, refresh, save]);
  return <RulesContext.Provider value={value}>{children}</RulesContext.Provider>;
}

export function useRules() {
  const ctx = useContext(RulesContext);
  if (!ctx) throw new Error('useRules must be used within a RulesProvider');
  return ctx;
}
