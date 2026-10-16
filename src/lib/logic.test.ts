import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importCsv, parseAmount, parseDate, parseCsv } from './csv';
import { autoCategorize } from './categorize';
import { DEFAULT_CATEGORIES } from './defaults';
import { summarize, budgetStatuses, pendingAlerts, goalForecast, buildInsights, kindOf } from './analytics';
import { ethToIso } from './ethiopian';
import type { Transaction } from './types';

const fmt = (n: number) => `ETB ${n.toFixed(0)}`;
const tx = (id: string, date: string, amount: number, categoryId: string, type: 'income' | 'expense' = 'expense'): Transaction =>
  ({ id, date, amount, categoryId, type, note: '', source: 'manual' });

test('amount and date parsing', () => {
  assert.equal(parseAmount('ETB 1,234.50'), 1234.5);
  assert.equal(parseAmount('(200)'), -200);
  assert.equal(parseAmount('-45.5'), -45.5);
  assert.equal(parseAmount(''), null);
  assert.equal(parseDate('2018-02-06', true), ethToIso({ year: 2018, month: 2, day: 6 }));
  assert.equal(parseDate('2018-13-06', true), null); // Pagume 6 invalid in non-leap year
  assert.equal(parseDate('2026-10-16', false), '2026-10-16');
  assert.equal(parseDate('16/10/2026', false), '2026-10-16');
  assert.equal(parseDate('2026-02-30', false), null);
});

test('csv parsing handles quotes and delimiters', () => {
  assert.deepEqual(parseCsv('a,b\n"x, y",2\n'), [['a', 'b'], ['x, y', '2']]);
  assert.deepEqual(parseCsv('a;b\n1;2'), [['a', 'b'], ['1', '2']]);
});

test('import: Ethiopian dates, debit/credit, auto-categorize', () => {
  const csv = 'Date,Description,Debit,Credit\n2019-02-01,Ethio Telecom airtime,150,\n2019-02-02,Monthly salary,,12000\nbad,x,1,\n';
  const r = importCsv(csv, { ethiopianDates: true, positiveIsExpense: false, categories: DEFAULT_CATEGORIES });
  assert.equal(r.rows.length, 2);
  assert.equal(r.rows[0].type, 'expense');
  assert.equal(r.rows[0].categoryId, 'bills');
  assert.equal(r.rows[1].categoryId, 'salary');
  assert.equal(r.rows[0].date, '2026-10-11');
  assert.equal(r.errors.length, 1);
});

test('import: single amount column sign handling', () => {
  const csv = 'date,amount,memo\n2026-10-01,-50,Taxi ride\n2026-10-02,300,Gift from aunt\n';
  const r = importCsv(csv, { ethiopianDates: false, positiveIsExpense: false, categories: DEFAULT_CATEGORIES });
  assert.deepEqual(r.rows.map((x) => [x.type, x.categoryId]), [['expense', 'transport'], ['income', 'gift']]);
});

test('autoCategorize falls back', () => {
  assert.equal(autoCategorize('zzz', 'expense', DEFAULT_CATEGORIES), 'other');
  assert.equal(autoCategorize('', 'income', DEFAULT_CATEGORIES), 'otherIncome');
});

test('month summary uses Ethiopian month boundaries', () => {
  // Tikimt 2019 = 2026-10-11 .. 2026-11-09
  const txs = [tx('1', '2026-10-10', 100, 'food'), tx('2', '2026-10-11', 200, 'food'), tx('3', '2026-11-09', 50, 'bills'), tx('4', '2026-11-10', 70, 'food'), tx('5', '2026-10-15', 1000, 'salary', 'income')];
  const s = summarize(txs, 2019, 2);
  assert.equal(s.expense, 250);
  assert.equal(s.income, 1000);
  assert.equal(s.net, 750);
  assert.equal(s.byCategory.food, 200);
});

test('budget thresholds and alerts fire once per level', () => {
  assert.equal(kindOf(0.79), 'ok');
  assert.equal(kindOf(0.8), 'warn');
  assert.equal(kindOf(1), 'over');
  const budgets = [{ categoryId: 'food', limit: 1000 }, { categoryId: 'fun', limit: 1000 }];
  const today = '2026-10-20';
  let txs = [tx('1', '2026-10-12', 850, 'food')];
  let alerts = pendingAlerts({ txs, categories: DEFAULT_CATEGORIES, budgets, fired: {}, today, fmt });
  assert.equal(alerts.length, 1);
  assert.match(alerts[0].title, /80%/);
  assert.match(alerts[0].body, /a day/); // actionable
  const fired = Object.fromEntries(alerts[0].keys.map((k) => [k, true]));
  assert.equal(pendingAlerts({ txs, categories: DEFAULT_CATEGORIES, budgets, fired, today, fmt }).length, 0);
  txs = [tx('1', '2026-10-12', 1200, 'food')];
  alerts = pendingAlerts({ txs, categories: DEFAULT_CATEGORIES, budgets, fired, today, fmt });
  assert.equal(alerts.length, 1);
  assert.match(alerts[0].title, /reached/);
  assert.match(alerts[0].body, /move .* from Entertainment/i); // suggests reallocating
});

test('goal forecast', () => {
  const g = { id: 'g', name: 'Laptop', target: 10000, createdAt: '2026-07-01', deadline: '2027-01-01', contributions: [{ id: 'a', amount: 1000, date: '2026-08-20' }, { id: 'b', amount: 2000, date: '2026-10-01' }] };
  const f = goalForecast(g, '2026-10-16');
  assert.equal(f.saved, 3000);
  assert.equal(f.remaining, 7000);
  assert.ok(f.monthlyRate > 0);
  assert.ok(f.projectedIso && f.projectedIso > '2026-10-16');
  assert.ok(f.requiredPerMonth && f.requiredPerMonth > 0);
  assert.equal(goalForecast({ ...g, contributions: [{ id: 'x', amount: 10000, date: '2026-10-01' }] }, '2026-10-16').done, true);
});

test('insights surface proactively', () => {
  const budgets = [{ categoryId: 'food', limit: 1000 }];
  const txs = [tx('1', '2026-10-15', 900, 'food'), tx('2', '2026-10-12', 20000, 'salary', 'income')];
  const ins = buildInsights({ txs, categories: DEFAULT_CATEGORIES, budgets, goals: [], ym: { year: 2019, month: 2 }, today: '2026-10-20', fmt });
  assert.ok(ins.some((i) => i.id === 'budget-food'));
  assert.ok(ins.some((i) => i.id === 'saver'));
  assert.equal(buildInsights({ txs: [], categories: DEFAULT_CATEGORIES, budgets: [], goals: [], ym: { year: 2019, month: 2 }, today: '2026-10-20', fmt })[0].id, 'empty');
  assert.equal(budgetStatuses(txs, DEFAULT_CATEGORIES, budgets, { year: 2019, month: 2 })[0].kind, 'warn');
});

import { dedupeIncoming } from './dedupe';
test('dedupe by bank id and by signature', () => {
  const a = tx('1', '2026-10-12', 100, 'food');
  const b = { ...tx('2', '2026-10-13', 50, 'bills'), externalId: 'demo:x', source: 'bank' as const };
  assert.equal(dedupeIncoming([a, b], [{ ...a, id: 'z' }, { ...b, id: 'y' }, tx('3', '2026-10-14', 10, 'food')]).length, 1);
});
