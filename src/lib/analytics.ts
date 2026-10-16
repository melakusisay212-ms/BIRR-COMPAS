import type { Budget, Category, Goal, Transaction } from './types';
import type { YearMonth } from './ethiopian';
import { addDays, addMonths, daysBetween, daysInMonth, isoToEth, monthOfIso, monthRange } from './ethiopian';

export type Fmt = (n: number) => string;

export interface MonthSummary {
  year: number;
  month: number;
  income: number;
  expense: number;
  net: number;
  byCategory: Record<string, number>; // expense per category
}

export function summarize(txs: Transaction[], year: number, month: number): MonthSummary {
  const { start, end } = monthRange(year, month);
  const s: MonthSummary = { year, month, income: 0, expense: 0, net: 0, byCategory: {} };
  for (const t of txs) {
    if (t.date < start || t.date > end) continue;
    if (t.type === 'income') s.income += t.amount;
    else {
      s.expense += t.amount;
      s.byCategory[t.categoryId] = (s.byCategory[t.categoryId] ?? 0) + t.amount;
    }
  }
  s.net = s.income - s.expense;
  return s;
}

export function monthlyTrend(txs: Transaction[], ym: YearMonth, n = 6): MonthSummary[] {
  const out: MonthSummary[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const m = addMonths(ym, -i);
    out.push(summarize(txs, m.year, m.month));
  }
  return out;
}

export type BudgetKind = 'ok' | 'warn' | 'over';
export const kindOf = (ratio: number): BudgetKind => (ratio >= 1 ? 'over' : ratio >= 0.8 ? 'warn' : 'ok');

export interface BudgetStatus { category: Category; limit: number; spent: number; ratio: number; kind: BudgetKind }

export function budgetStatuses(txs: Transaction[], categories: Category[], budgets: Budget[], ym: YearMonth): BudgetStatus[] {
  const sum = summarize(txs, ym.year, ym.month);
  const out: BudgetStatus[] = [];
  for (const b of budgets) {
    const category = categories.find((c) => c.id === b.categoryId);
    if (!category || b.limit <= 0) continue;
    const spent = sum.byCategory[b.categoryId] ?? 0;
    const ratio = spent / b.limit;
    out.push({ category, limit: b.limit, spent, ratio, kind: kindOf(ratio) });
  }
  return out;
}

// Days left in the Ethiopian month, counting today. Null when `today` is not in that month.
export function daysLeftInMonth(ym: YearMonth, today: string): number | null {
  const t = isoToEth(today);
  if (t.year !== ym.year || t.month !== ym.month) return null;
  return daysInMonth(ym.year, ym.month) - t.day + 1;
}

// Actionable suggestion (not just a warning) for a budget at >= 80%.
export function budgetSuggestion(st: BudgetStatus, all: BudgetStatus[], daysLeft: number | null, fmt: Fmt): string {
  const name = st.category.name;
  if (st.kind === 'over') {
    const over = st.spent - st.limit;
    const room = all
      .filter((o) => o.category.id !== st.category.id && o.limit - o.spent > 0 && o.ratio < 0.6)
      .sort((a, b) => b.limit - b.spent - (a.limit - a.spent))[0];
    const move = room ? ` Or move ${fmt(Math.min(over, room.limit - room.spent))} over from ${room.category.name}, which has room.` : '';
    return `You are ${fmt(over)} over. Pause ${name} spending for the rest of the month, or raise the limit.${move}`;
  }
  const left = st.limit - st.spent;
  if (daysLeft && daysLeft > 0) {
    return `${fmt(left)} left for ${daysLeft} day${daysLeft === 1 ? '' : 's'}: about ${fmt(left / daysLeft)} a day. Defer one non-essential ${name} purchase to stay inside the limit.`;
  }
  return `${fmt(left)} left in this budget. Defer one non-essential ${name} purchase to stay inside the limit.`;
}

export interface GoalForecast {
  saved: number;
  remaining: number;
  pct: number;
  done: boolean;
  monthlyRate: number;
  projectedIso?: string;
  requiredPerMonth?: number;
  onTrack?: boolean;
}

export const goalSaved = (g: Goal) => g.contributions.reduce((a, c) => a + c.amount, 0);

export function goalForecast(g: Goal, today: string): GoalForecast {
  const saved = goalSaved(g);
  const remaining = Math.max(0, g.target - saved);
  const pct = g.target > 0 ? Math.min(1, saved / g.target) : 0;
  const done = saved >= g.target;
  // Contribution pace: last 90 days; falls back to lifetime pace if nothing recent.
  const cutoff = addDays(today, -90);
  const recent = g.contributions.filter((c) => c.date >= cutoff && c.date <= today).reduce((a, c) => a + c.amount, 0);
  let monthlyRate = recent / 3;
  if (recent <= 0 && g.contributions.length > 0) {
    const first = g.contributions.map((c) => c.date).sort()[0];
    const months = Math.max(1, daysBetween(first, today) / 30);
    monthlyRate = Math.max(0, saved / months);
  }
  const f: GoalForecast = { saved, remaining, pct, done, monthlyRate };
  if (!done && monthlyRate > 0) f.projectedIso = addDays(today, Math.ceil((remaining / monthlyRate) * 30));
  if (!done && g.deadline) {
    const monthsLeft = Math.max(1, daysBetween(today, g.deadline) / 30);
    f.requiredPerMonth = remaining / monthsLeft;
    f.onTrack = !!f.projectedIso && f.projectedIso <= g.deadline;
  }
  return f;
}

export interface Insight { id: string; tone: 'warn' | 'good' | 'info'; title: string; body: string }

export function buildInsights(a: {
  txs: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  ym: YearMonth;
  today: string;
  fmt: Fmt;
}): Insight[] {
  const { txs, categories, budgets, goals, ym, today, fmt } = a;
  const out: Insight[] = [];
  if (txs.length === 0) {
    return [{ id: 'empty', tone: 'info', title: 'Start tracking', body: 'Add your first transaction or import a bank statement CSV to see spending insights here.' }];
  }
  const cur = summarize(txs, ym.year, ym.month);
  const prev = summarize(txs, addMonths(ym, -1).year, addMonths(ym, -1).month);
  const left = daysLeftInMonth(ym, today);
  const isCurrent = left !== null;
  const statuses = budgetStatuses(txs, categories, budgets, ym);

  for (const st of statuses.filter((s) => s.kind !== 'ok').sort((x, y) => y.ratio - x.ratio)) {
    out.push({
      id: `budget-${st.category.id}`,
      tone: 'warn',
      title: st.kind === 'over' ? `${st.category.name} is over budget` : `${st.category.name} is at ${Math.round(st.ratio * 100)}%`,
      body: budgetSuggestion(st, statuses, left, fmt),
    });
  }

  const totalLimit = statuses.reduce((s, x) => s + x.limit, 0);
  if (isCurrent && totalLimit > 0) {
    const dim = daysInMonth(ym.year, ym.month);
    const elapsed = dim - (left as number) + 1;
    const budgetedSpend = statuses.reduce((s, x) => s + x.spent, 0);
    if (elapsed >= 5 && budgetedSpend < totalLimit) {
      const projected = (budgetedSpend / elapsed) * dim;
      if (projected > totalLimit) {
        out.push({ id: 'pace', tone: 'warn', title: 'On pace to overspend', body: `At this rate you will spend about ${fmt(projected)} against ${fmt(totalLimit)} budgeted. Trim roughly ${fmt((projected - totalLimit) / Math.max(1, left as number))} a day to land on target.` });
      }
    }
  }

  let surge: { c: Category; pct: number } | null = null;
  for (const c of categories.filter((c) => c.kind === 'expense')) {
    const now = cur.byCategory[c.id] ?? 0;
    const before = prev.byCategory[c.id] ?? 0;
    if (before > 0 && now > before * 1.3 && now - before >= prev.expense * 0.05) {
      const pct = (now - before) / before;
      if (!surge || pct > surge.pct) surge = { c, pct };
    }
  }
  if (surge) {
    out.push({ id: `surge-${surge.c.id}`, tone: 'info', title: `${surge.c.name} is up ${Math.round(surge.pct * 100)}%`, body: `${fmt(cur.byCategory[surge.c.id])} so far versus ${fmt(prev.byCategory[surge.c.id] ?? 0)} last month.` });
  }

  if (cur.income > 0 && cur.net / cur.income >= 0.2) {
    out.push({ id: 'saver', tone: 'good', title: 'Strong month', body: `You kept ${Math.round((cur.net / cur.income) * 100)}% of income (${fmt(cur.net)}). Consider moving some of it to a goal.` });
  }

  for (const g of goals) {
    const f = goalForecast(g, today);
    if (f.done || !g.deadline || f.onTrack !== false) continue;
    out.push({ id: `goal-${g.id}`, tone: 'warn', title: `${g.name} is behind schedule`, body: `Save about ${fmt(f.requiredPerMonth ?? 0)} a month to reach it by the deadline.` });
  }

  const rank = { warn: 0, info: 1, good: 2 } as const;
  return out.sort((x, y) => rank[x.tone] - rank[y.tone]).slice(0, 5);
}

export interface PendingAlert { keys: string[]; title: string; body: string }

// Budget alerts at 80% and 100%, once per category per Ethiopian month.
export function pendingAlerts(a: {
  txs: Transaction[]; categories: Category[]; budgets: Budget[]; fired: Record<string, boolean>; today: string; fmt: Fmt;
}): PendingAlert[] {
  const ym = monthOfIso(a.today);
  const statuses = budgetStatuses(a.txs, a.categories, a.budgets, ym);
  const left = daysLeftInMonth(ym, a.today);
  const out: PendingAlert[] = [];
  for (const st of statuses) {
    const k = (p: number) => `${ym.year}-${ym.month}:${st.category.id}:${p}`;
    if (st.ratio >= 1 && !a.fired[k(100)]) {
      out.push({ keys: [k(80), k(100)], title: `${st.category.name}: budget reached`, body: budgetSuggestion(st, statuses, left, a.fmt) });
    } else if (st.ratio >= 0.8 && st.ratio < 1 && !a.fired[k(80)]) {
      out.push({ keys: [k(80)], title: `${st.category.name}: 80% of budget used`, body: budgetSuggestion(st, statuses, left, a.fmt) });
    }
  }
  return out;
}
