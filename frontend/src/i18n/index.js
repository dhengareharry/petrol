import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { REWARDS } from '../data/rewards';
import en from './translations/en';
import hi from './translations/hi';
import mr from './translations/mr';

export const DEFAULT_LANGUAGE = 'en';

// `nativeName` is how the language writes its own name, so people can find it even when the app is in another language.
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
];

const DICTIONARIES = { en, hi, mr };
const STORE_KEY = 'oasis_language';

// Messages the server sends in English, mapped to a translated text. Anything not listed is shown as the server wrote it.
const SERVER_MESSAGES = {
  'Incorrect phone number or PIN.': 'err.badLogin',
  'A customer with this phone number already exists. Please log in instead.': 'err.phoneExists',
  'A customer with this phone number already exists.': 'err.phoneExists',
  'Current PIN is incorrect.': 'err.currentPin',
  'PIN must be exactly 4 digits.': 'err.pin4',
  'Referral code not found.': 'err.referralNotFound',
  'You cannot refer yourself.': 'err.referSelf',
  'Not enough available points for this reward.': 'err.notEnoughPoints',
  'Enter the vehicle number along with the vehicle model.': 'err.vehicleNeedsNumber',
  'Vehicle not found.': 'err.vehicleNotFound',
  'This account is no longer active.': 'err.notActive',
  'This account has been disabled. Contact an admin.': 'err.disabled',
  'Enter a valid 10-digit mobile number (it must start with 6, 7, 8 or 9).': 'phone.invalidStart',
  'Enter a valid 10-digit mobile number.': 'phone.invalid',
};

function interpolate(text, params) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => (params[name] === undefined ? match : String(params[name])));
}

const I18nContext = createContext(null);

/** Holds the chosen language (English until the user picks another), remembers it on the device, and provides t(). */
export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORE_KEY)
      .then((saved) => {
        if (!cancelled && saved && DICTIONARIES[saved]) setLanguageState(saved);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((code) => {
    if (!DICTIONARIES[code]) return;
    setLanguageState(code);
    AsyncStorage.setItem(STORE_KEY, code).catch(() => undefined);
  }, []);

  const value = useMemo(() => buildApi(language, ready, setLanguage), [language, ready, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

const noop = () => undefined;

/** Pins a part of the app to one language whatever the user chose (the staff panel stays in English). */
export function FixedLanguage({ code, children }) {
  const value = useMemo(() => buildApi(code, true, noop), [code]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Everything a screen needs for one language: t(), formatters and the language list. */
function buildApi(language, ready, setLanguage) {
  const dictionary = DICTIONARIES[language];
  // -u-nu-latn keeps the digits as 0-9 (Marathi would otherwise print Devanagari digits next to Latin amounts).
  const locale = `${language}-IN-u-nu-latn`;

  /** Looks a key up in the chosen language, falling back to English. `count` picks the _one / _other form. */
  const t = (key, params) => {
    let lookup = key;
    if (params && typeof params.count === 'number') lookup = `${key}_${params.count === 1 ? 'one' : 'other'}`;
    const text = dictionary[lookup] ?? en[lookup] ?? dictionary[key] ?? en[key] ?? key;
    return interpolate(text, params);
  };

  /** A reward's name in the chosen language; `reward` is an id or an object with an `id` (and an English `name`). */
  const rewardName = (reward) => {
    const id = typeof reward === 'string' ? reward : reward?.id;
    return dictionary[`reward.${id}`] ?? (typeof reward === 'object' ? reward?.name : undefined) ?? id;
  };

  const tierLabel = (tier) => t(`tier.${tier.key}`);

  /** A message from the server (or a network failure) in the chosen language, when it is one we know. */
  const errorText = (error) => {
    if (error?.code === 'NETWORK') return t('err.network');
    const message = typeof error === 'string' ? error : error?.message;
    if (!message) return '';
    if (SERVER_MESSAGES[message]) return t(SERVER_MESSAGES[message]);
    if (message.startsWith('Enter a valid vehicle number')) return t('vehicle.error');
    return message;
  };

  /** An activity line the server wrote in English ("Fuel purchase: 7 ltr", a reward name…) in the chosen language. */
  const ledgerLabel = (label) => {
    let match = /^Fuel purchase: (\d+) ltr$/.exec(label);
    if (match) return t('ledger.fuel', { n: match[1] });
    match = /^Referral bonus: (.+) joined using your code$/.exec(label);
    if (match) return t('ledger.referrer', { name: match[1] });
    match = /^Welcome bonus: you joined using (.+)'s referral code$/.exec(label);
    if (match) return t('ledger.welcome', { name: match[1] });
    const reward = REWARDS.find((r) => r.name === label);
    return reward ? rewardName(reward) : label;
  };

  const formatDate = (iso, options = { day: 'numeric', month: 'short', year: 'numeric' }) =>
    new Date(iso).toLocaleDateString(locale, options);
  const formatTime = (iso) => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  return { ready, language, setLanguage, languages: LANGUAGES, locale, t, rewardName, tierLabel, errorText, ledgerLabel, formatDate, formatTime };
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}
