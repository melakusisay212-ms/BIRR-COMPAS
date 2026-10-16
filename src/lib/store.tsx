import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState, BankLogEntry, Category, Goal, Settings, Transaction } from './types';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, OTHER_EXPENSE, OTHER_INCOME } from './defaults';
import { dedupeIncoming } from './dedupe';
import { formatMoney } from './format';

const KEY = 'birr-compass:v1';
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

type Action =
  | { type: 'hydrate'; state: Partial<AppState> }
  | { type: 'addTx'; tx: Transaction }
  | { type: 'updateTx'; tx: Transaction }
  | { type: 'deleteTx'; id: string }
  | { type: 'addTxs'; txs: Transaction[] }
  | { type: 'setBudget'; categoryId: string; limit: number | null }
  | { type: 'saveCategory'; category: Category }
  | { type: 'deleteCategory'; id: string }
  | { type: 'saveGoal'; goal: Goal }
  | { type: 'deleteGoal'; id: string }
  | { type: 'contribute'; goalId: string; amount: number; date: string }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'markAlerts'; keys: string[] }
  | { type: 'bankLog'; entry: BankLogEntry }
  | { type: 'bankSynced'; at: string }
  | { type: 'clearBankLog' }
  | { type: 'wipe' };

const initial: AppState = {
  hydrated: false,
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  budgets: [],
  goals: [],
  settings: DEFAULT_SETTINGS,
  alertsFired: {},
  bankLog: [],
};

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'hydrate': {
      const saved = a.state;
      const cats = saved.categories?.length ? saved.categories : DEFAULT_CATEGORIES;
      for (const d of DEFAULT_CATEGORIES) if ((d.id === OTHER_EXPENSE || d.id === OTHER_INCOME) && !cats.some((c) => c.id === d.id)) cats.push(d);
      return { ...initial, ...saved, categories: cats, settings: { ...DEFAULT_SETTINGS, ...(saved.settings ?? {}) }, hydrated: true };
    }
    case 'addTx': return { ...s, transactions: [a.tx, ...s.transactions] };
    case 'updateTx': return { ...s, transactions: s.transactions.map((t) => (t.id === a.tx.id ? a.tx : t)) };
    case 'deleteTx': return { ...s, transactions: s.transactions.filter((t) => t.id !== a.id) };
    case 'addTxs': return { ...s, transactions: [...dedupeIncoming(s.transactions, a.txs), ...s.transactions] };
    case 'setBudget': {
      const rest = s.budgets.filter((b) => b.categoryId !== a.categoryId);
      return { ...s, budgets: a.limit && a.limit > 0 ? [...rest, { categoryId: a.categoryId, limit: a.limit }] : rest };
    }
    case 'saveCategory': {
      const exists = s.categories.some((c) => c.id === a.category.id);
      return { ...s, categories: exists ? s.categories.map((c) => (c.id === a.category.id ? a.category : c)) : [...s.categories, a.category] };
    }
    case 'deleteCategory': {
      const cat = s.categories.find((c) => c.id === a.id);
      if (!cat || a.id === OTHER_EXPENSE || a.id === OTHER_INCOME) return s;
      const fb = cat.kind === 'income' ? OTHER_INCOME : OTHER_EXPENSE;
      return {
        ...s,
        categories: s.categories.filter((c) => c.id !== a.id),
        budgets: s.budgets.filter((b) => b.categoryId !== a.id),
        transactions: s.transactions.map((t) => (t.categoryId === a.id ? { ...t, categoryId: fb } : t)),
      };
    }
    case 'saveGoal': {
      const exists = s.goals.some((g) => g.id === a.goal.id);
      return { ...s, goals: exists ? s.goals.map((g) => (g.id === a.goal.id ? a.goal : g)) : [a.goal, ...s.goals] };
    }
    case 'deleteGoal': return { ...s, goals: s.goals.filter((g) => g.id !== a.id) };
    case 'contribute':
      return { ...s, goals: s.goals.map((g) => (g.id === a.goalId ? { ...g, contributions: [...g.contributions, { id: uid(), amount: a.amount, date: a.date }] } : g)) };
    case 'settings': return { ...s, settings: { ...s.settings, ...a.patch } };
    case 'markAlerts': return { ...s, alertsFired: { ...s.alertsFired, ...Object.fromEntries(a.keys.map((k) => [k, true])) } };
    case 'bankLog': return { ...s, bankLog: [a.entry, ...s.bankLog].slice(0, 60) };
    case 'bankSynced': return { ...s, lastBankSync: a.at };
    case 'clearBankLog': return { ...s, bankLog: [] };
    case 'wipe': return { ...initial, hydrated: true };
    default: return s;
  }
}

interface Ctx { state: AppState; dispatch: React.Dispatch<Action>; money: (n: number) => string }
const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => dispatch({ type: 'hydrate', state: raw ? JSON.parse(raw) : {} }))
      .catch(() => dispatch({ type: 'hydrate', state: {} }));
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const h = setTimeout(() => {
      const { hydrated, ...rest } = state;
      AsyncStorage.setItem(KEY, JSON.stringify(rest)).catch(() => {});
    }, 300);
    return () => clearTimeout(h);
  }, [state]);

  const currency = state.settings.currency;
  const value = useMemo<Ctx>(() => ({ state, dispatch, money: (n: number) => formatMoney(n, currency) }), [state, currency]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const c = useContext(StoreContext);
  if (!c) throw new Error('StoreProvider missing');
  return c;
}
