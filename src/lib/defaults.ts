import type { Category, Settings } from './types';

export const OTHER_EXPENSE = 'other';
export const OTHER_INCOME = 'otherIncome';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'housing', name: 'Housing & Rent', nameAm: 'ቤት', icon: 'home', color: '#8E6C4A', kind: 'expense' },
  { id: 'food', name: 'Food & Groceries', nameAm: 'ምግብ', icon: 'restaurant', color: '#E07A1F', kind: 'expense' },
  { id: 'transport', name: 'Transport', nameAm: 'ትራንስፖርት', icon: 'car', color: '#2F7DD1', kind: 'expense' },
  { id: 'bills', name: 'Bills & Airtime', nameAm: 'ሂሳቦች', icon: 'phone-portrait', color: '#7B5CD6', kind: 'expense' },
  { id: 'health', name: 'Health', nameAm: 'ጤና', icon: 'medkit', color: '#D64F6A', kind: 'expense' },
  { id: 'education', name: 'Education', nameAm: 'ትምህርት', icon: 'school', color: '#1E9E8F', kind: 'expense' },
  { id: 'shopping', name: 'Shopping', nameAm: 'ግብይት', icon: 'bag', color: '#C2479B', kind: 'expense' },
  { id: 'fun', name: 'Entertainment', nameAm: 'መዝናኛ', icon: 'game-controller', color: '#E0B000', kind: 'expense' },
  { id: 'family', name: 'Family & Gifts', nameAm: 'ቤተሰብ', icon: 'people', color: '#4FA14A', kind: 'expense' },
  { id: 'equb', name: 'Equb & Idir', nameAm: 'እቁብ እና ዕድር', icon: 'repeat', color: '#5A6B7B', kind: 'expense' },
  { id: OTHER_EXPENSE, name: 'Other', nameAm: 'ሌላ', icon: 'ellipsis-horizontal', color: '#8A8A8A', kind: 'expense' },
  { id: 'salary', name: 'Salary', nameAm: 'ደመወዝ', icon: 'cash', color: '#0B7A3B', kind: 'income' },
  { id: 'business', name: 'Business', nameAm: 'ንግድ', icon: 'briefcase', color: '#2F7DD1', kind: 'income' },
  { id: 'gift', name: 'Gifts received', nameAm: 'ስጦታ', icon: 'gift', color: '#C2479B', kind: 'income' },
  { id: OTHER_INCOME, name: 'Other income', nameAm: 'ሌላ ገቢ', icon: 'add-circle', color: '#8A8A8A', kind: 'income' },
];

export const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  showGregorian: true,
  notifications: false,
  bankSyncOptIn: false,
};

export const ICON_CHOICES = ['home', 'restaurant', 'car', 'phone-portrait', 'medkit', 'school', 'bag', 'game-controller', 'people', 'repeat', 'cash', 'briefcase', 'gift', 'paw', 'airplane', 'fitness', 'cafe', 'build', 'heart', 'star'];
export const COLOR_CHOICES = ['#0B7A3B', '#2F7DD1', '#E07A1F', '#D64F6A', '#7B5CD6', '#1E9E8F', '#C2479B', '#E0B000', '#8E6C4A', '#5A6B7B'];
