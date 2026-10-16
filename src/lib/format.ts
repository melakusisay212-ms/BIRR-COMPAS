import { getLocales } from 'expo-localization';
import type { Settings } from './types';
import { Lang, formatEthIso, isoToJdn, jdnToGregorian } from './ethiopian';

export function deviceLocale() {
  const l = getLocales()[0];
  return { tag: l?.languageTag ?? 'en-US', currency: l?.currencyCode ?? 'ETB' };
}

// Currency formatting follows the device locale (override available in Settings).
export function formatMoney(amount: number, currencyOverride?: string): string {
  const { tag, currency } = deviceLocale();
  const code = (currencyOverride || currency || 'ETB').toUpperCase();
  try {
    return new Intl.NumberFormat(tag, { style: 'currency', currency: code }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

export function gregorianLabel(iso: string): string {
  const g = jdnToGregorian(isoToJdn(iso));
  const d = new Date(g.year, g.month - 1, g.day);
  try {
    return d.toLocaleDateString(deviceLocale().tag, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function formatDate(iso: string, settings: Pick<Settings, 'language' | 'showGregorian'>) {
  return { primary: formatEthIso(iso, settings.language as Lang), secondary: settings.showGregorian ? gregorianLabel(iso) : undefined };
}
