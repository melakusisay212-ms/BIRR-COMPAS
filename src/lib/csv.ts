import type { Category, TxType } from './types';
import { autoCategorize } from './categorize';
import { ethToIso, isValidEth, gregorianToJdn, jdnToIso } from './ethiopian';

export interface ImportRow { date: string; amount: number; type: TxType; note: string; categoryId: string }
export interface ImportResult { rows: ImportRow[]; errors: string[] }
export interface ImportOptions {
  ethiopianDates: boolean; // dates in the file are Ethiopian calendar dates
  positiveIsExpense: boolean; // for single-amount-column statements that list spending as positive
  categories: Category[];
}

export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '');
  const first = clean.split(/\r?\n/)[0] ?? '';
  const delim = [',', ';', '\t'].map((d) => [d, first.split(d).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

export function parseAmount(s: string): number | null {
  if (s == null) return null;
  let t = s.trim();
  if (!t) return null;
  const negParen = /^\(.*\)$/.test(t);
  t = t.replace(/,/g, '').replace(/[^0-9.\-]/g, '');
  if (!t || t === '-' || t === '.') return null;
  let n = parseFloat(t);
  if (!isFinite(n)) return null;
  if (negParen) n = -Math.abs(n);
  return n;
}

export function parseDate(s: string, ethiopian: boolean): string | null {
  const t = (s ?? '').trim().split(/[ T]/)[0];
  let y: number, m: number, d: number;
  let mt = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (mt) { y = +mt[1]; m = +mt[2]; d = +mt[3]; }
  else if ((mt = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) { d = +mt[1]; m = +mt[2]; y = +mt[3]; }
  else return null;
  if (ethiopian) {
    const e = { year: y, month: m, day: d };
    return isValidEth(e) ? ethToIso(e) : null;
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const iso = jdnToIso(gregorianToJdn(y, m, d));
  return iso === `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` ? iso : null;
}

export function importCsv(text: string, opts: ImportOptions): ImportResult {
  const table = parseCsv(text);
  const errors: string[] = [];
  if (table.length < 2) return { rows: [], errors: ['The file has no data rows.'] };
  const head = table[0].map((h) => h.trim().toLowerCase());
  const find = (re: RegExp) => head.findIndex((h) => re.test(h));
  const iDate = find(/date|ቀን/);
  const iDebit = find(/debit|withdraw|paid out|money out/);
  const iCredit = find(/credit|deposit|paid in|money in/);
  const iAmount = head.findIndex((h) => /^(amount|value|sum|total)/.test(h));
  const iNote = find(/desc|note|memo|narrat|detail|particular|reference|payee/);
  const iType = head.findIndex((h) => /^(type|dr\/cr|transaction type)/.test(h));
  const iCat = find(/categ/);
  if (iDate < 0) return { rows: [], errors: ['Could not find a "date" column in the header row.'] };
  if (iAmount < 0 && iDebit < 0 && iCredit < 0) return { rows: [], errors: ['Could not find an "amount" (or debit/credit) column.'] };

  const rows: ImportRow[] = [];
  for (let r = 1; r < table.length; r++) {
    const line = table[r];
    const n = r + 1;
    const date = parseDate(line[iDate] ?? '', opts.ethiopianDates);
    if (!date) { errors.push(`Row ${n}: unreadable date "${line[iDate] ?? ''}"`); continue; }
    let type: TxType | null = null;
    let amount: number | null = null;
    if (iDebit >= 0 || iCredit >= 0) {
      const dbt = iDebit >= 0 ? parseAmount(line[iDebit] ?? '') : null;
      const crd = iCredit >= 0 ? parseAmount(line[iCredit] ?? '') : null;
      if (dbt && Math.abs(dbt) > 0) { type = 'expense'; amount = Math.abs(dbt); }
      else if (crd && Math.abs(crd) > 0) { type = 'income'; amount = Math.abs(crd); }
    } else {
      const a = parseAmount(line[iAmount] ?? '');
      if (a !== null && a !== 0) {
        amount = Math.abs(a);
        const typeText = iType >= 0 ? (line[iType] ?? '').toLowerCase() : '';
        if (/debit|\bdr\b|expense|withdraw|out/.test(typeText)) type = 'expense';
        else if (/credit|\bcr\b|income|deposit|\bin\b/.test(typeText)) type = 'income';
        else if (a < 0) type = 'expense';
        else type = opts.positiveIsExpense ? 'expense' : 'income';
      }
    }
    if (!type || amount === null) { errors.push(`Row ${n}: no usable amount`); continue; }
    const note = (iNote >= 0 ? line[iNote] ?? '' : '').trim();
    const catText = (iCat >= 0 ? line[iCat] ?? '' : '').trim().toLowerCase();
    const byName = catText ? opts.categories.find((c) => c.kind === type && (c.name.toLowerCase() === catText || (c.nameAm ?? '') === catText)) : undefined;
    rows.push({
      date,
      amount: Math.round(amount * 100) / 100,
      type,
      note,
      categoryId: byName ? byName.id : autoCategorize(note, type, opts.categories),
    });
  }
  return { rows, errors };
}
