import type { Category, TxType } from './types';
import { OTHER_EXPENSE, OTHER_INCOME } from './defaults';

// Keyword rules for on-device auto-categorization (Ethiopian context included).
const RULES: { id: string; type: TxType; words: string[] }[] = [
  { id: 'salary', type: 'income', words: ['salary', 'payroll', 'wage', 'ደመወዝ'] },
  { id: 'business', type: 'income', words: ['invoice', 'sale', 'client', 'customer', 'revenue'] },
  { id: 'gift', type: 'income', words: ['gift', 'received from', 'remittance', 'western union', 'moneygram'] },
  { id: 'housing', type: 'expense', words: ['rent', 'landlord', 'mortgage', 'ቤት ኪራይ', 'house'] },
  { id: 'food', type: 'expense', words: ['supermarket', 'mart', 'grocer', 'bakery', 'restaurant', 'cafe', 'coffee', 'kaldi', 'injera', 'butcher', 'merkato', 'shoa', 'lunch', 'dinner', 'pizza', 'burger', 'ምግብ'] },
  { id: 'transport', type: 'expense', words: ['taxi', 'ride', 'feres', 'zayride', 'bus', 'anbessa', 'fuel', 'petrol', 'diesel', 'shell', 'total energies', 'noc', 'parking', 'ethiopian airlines', 'flight'] },
  { id: 'bills', type: 'expense', words: ['ethio telecom', 'telecom', 'safaricom', 'airtime', 'data pack', 'internet', 'electric', 'ethiopian electric', 'water', 'dstv', 'utility', 'bill', 'telebirr airtime'] },
  { id: 'health', type: 'expense', words: ['pharmacy', 'hospital', 'clinic', 'doctor', 'medical', 'dental', 'lab', 'medicine'] },
  { id: 'education', type: 'expense', words: ['school', 'tuition', 'university', 'college', 'course', 'book', 'ትምህርት'] },
  { id: 'fun', type: 'expense', words: ['cinema', 'movie', 'netflix', 'spotify', 'game', 'bar', 'club', 'concert'] },
  { id: 'family', type: 'expense', words: ['family', 'mother', 'father', 'wedding', 'gift to', 'church', 'donation'] },
  { id: 'equb', type: 'expense', words: ['equb', 'ekub', 'idir', 'iddir', 'እቁብ', 'ዕድር'] },
  { id: 'shopping', type: 'expense', words: ['clothes', 'shoes', 'mall', 'shop', 'store', 'amazon', 'electronics'] },
];

export function autoCategorize(note: string, type: TxType, categories: Category[]): string {
  const text = note.toLowerCase();
  const fallback = type === 'income' ? OTHER_INCOME : OTHER_EXPENSE;
  if (!text.trim()) return fallback;
  for (const r of RULES) {
    if (r.type !== type) continue;
    if (!categories.some((c) => c.id === r.id)) continue;
    if (r.words.some((w) => text.includes(w))) return r.id;
  }
  // user-defined categories: match by name appearing in the note
  const custom = categories.find((c) => c.kind === type && c.name.length > 2 && text.includes(c.name.toLowerCase()));
  return custom ? custom.id : fallback;
}
