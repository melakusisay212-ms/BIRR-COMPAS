// Ethiopian (Amete Mihret) calendar engine. Pure functions, no dependencies.
// 13 months: 12 x 30 days + Pagume (5 days, 6 in leap years). Leap year: year % 4 === 3.

export interface EthDate { year: number; month: number; day: number }

const JD_OFFSET = 1723856;

export const MONTHS_EN = ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'];
export const MONTHS_AM = ['መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን'];
export const WEEKDAYS_EN = ['Ehud', 'Segno', 'Maksegno', 'Rob', 'Hamus', 'Arb', 'Kidame'];
export const WEEKDAYS_AM = ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'];

export type Lang = 'en' | 'am';

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

export function gregorianToJdn(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

export function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    day: e - Math.floor((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * Math.floor(m / 10),
    year: 100 * b + d - 4800 + Math.floor(m / 10),
  };
}

export function ethToJdn({ year, month, day }: EthDate): number {
  return JD_OFFSET + 365 + 365 * (year - 1) + Math.floor(year / 4) + 30 * month + day - 31;
}

export function jdnToEth(jdn: number): EthDate {
  const r = (jdn - JD_OFFSET) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  return {
    year: 4 * Math.floor((jdn - JD_OFFSET) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460),
    month: Math.floor(n / 30) + 1,
    day: (n % 30) + 1,
  };
}

export const isLeap = (year: number) => year % 4 === 3;
export const daysInMonth = (year: number, month: number) => (month < 13 ? 30 : isLeap(year) ? 6 : 5);
export const isValidEth = ({ year, month, day }: EthDate) =>
  Number.isInteger(year) && year > 0 && month >= 1 && month <= 13 && day >= 1 && day <= daysInMonth(year, month);

// ISO strings are always Gregorian 'YYYY-MM-DD' and are what gets stored.
export function isoToJdn(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return gregorianToJdn(y, m, d);
}
export function jdnToIso(jdn: number): string {
  const g = jdnToGregorian(jdn);
  return `${pad(g.year, 4)}-${pad(g.month)}-${pad(g.day)}`;
}
export const isoToEth = (iso: string): EthDate => jdnToEth(isoToJdn(iso));
export const ethToIso = (e: EthDate): string => jdnToIso(ethToJdn(e));

export function todayIso(): string {
  const n = new Date();
  return `${pad(n.getFullYear(), 4)}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}

export const addDays = (iso: string, n: number) => jdnToIso(isoToJdn(iso) + n);
export const daysBetween = (fromIso: string, toIso: string) => isoToJdn(toIso) - isoToJdn(fromIso);
export const weekdayIndex = (iso: string) => (isoToJdn(iso) + 1) % 7; // 0 = Sunday

export interface YearMonth { year: number; month: number }

export function addMonths(ym: YearMonth, delta: number): YearMonth {
  const idx = ym.year * 13 + (ym.month - 1) + delta;
  return { year: Math.floor(idx / 13), month: (idx % 13) + 1 };
}

export function monthRange(year: number, month: number): { start: string; end: string } {
  return {
    start: ethToIso({ year, month, day: 1 }),
    end: ethToIso({ year, month, day: daysInMonth(year, month) }),
  };
}

export function monthOfIso(iso: string): YearMonth {
  const e = isoToEth(iso);
  return { year: e.year, month: e.month };
}

export const monthName = (month: number, lang: Lang = 'en') => (lang === 'am' ? MONTHS_AM : MONTHS_EN)[month - 1];
export const weekdayName = (iso: string, lang: Lang = 'en') => (lang === 'am' ? WEEKDAYS_AM : WEEKDAYS_EN)[weekdayIndex(iso)];

export function formatEth(e: EthDate, lang: Lang = 'en'): string {
  return `${monthName(e.month, lang)} ${e.day}, ${e.year}`;
}
export const formatEthIso = (iso: string, lang: Lang = 'en') => formatEth(isoToEth(iso), lang);
