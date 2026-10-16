export type TxType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  nameAm?: string;
  icon: string; // Ionicons glyph name
  color: string;
  kind: TxType;
}

export interface Transaction {
  id: string;
  type: TxType;
  amount: number; // always positive; `type` carries the sign
  categoryId: string;
  note: string;
  date: string; // Gregorian ISO YYYY-MM-DD (rendered in the Ethiopian calendar)
  source: 'manual' | 'import' | 'bank';
  externalId?: string; // bank-provided id, used for de-duplication
}

export interface Budget { categoryId: string; limit: number } // monthly, per Ethiopian month

export interface Contribution { id: string; amount: number; date: string }

export interface Goal {
  id: string;
  name: string;
  target: number;
  deadline?: string; // ISO
  createdAt: string; // ISO
  contributions: Contribution[]; // saved = sum of contributions
}

export interface Settings {
  language: 'en' | 'am';
  showGregorian: boolean;
  notifications: boolean;
  bankSyncOptIn: boolean;
  currency?: string; // override; otherwise device locale currency
}

export interface BankLogEntry { at: string; provider: string; action: string; detail: string }

export interface AppState {
  hydrated: boolean;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  settings: Settings;
  alertsFired: Record<string, boolean>;
  bankLog: BankLogEntry[];
  lastBankSync?: string;
}
