import type { Lang } from './ethiopian';

// Navigation labels are translated; month and weekday names live in ethiopian.ts.
const dict: Record<string, { en: string; am: string }> = {
  home: { en: 'Home', am: 'ዋና' },
  transactions: { en: 'Transactions', am: 'ግብይቶች' },
  budgets: { en: 'Budgets', am: 'በጀት' },
  analysis: { en: 'Analysis', am: 'ትንተና' },
  goals: { en: 'Goals', am: 'ግቦች' },
  settings: { en: 'Settings', am: 'ቅንብሮች' },
};
export const tr = (key: keyof typeof dict | string, lang: Lang) => dict[key]?.[lang] ?? key;
