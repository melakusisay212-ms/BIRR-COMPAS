import type { Transaction } from './types';

const sig = (t: Transaction) => `${t.date}|${t.type}|${t.amount}|${t.note.trim().toLowerCase()}`;

// Drops incoming transactions that already exist (by bank id, else by date/type/amount/note).
export function dedupeIncoming(existing: Transaction[], incoming: Transaction[]): Transaction[] {
  const ext = new Set(existing.filter((t) => t.externalId).map((t) => t.externalId));
  const sigs = new Set(existing.map(sig));
  const out: Transaction[] = [];
  for (const t of incoming) {
    if (t.externalId) {
      if (ext.has(t.externalId)) continue;
      ext.add(t.externalId);
    } else if (sigs.has(sig(t))) continue;
    out.push(t);
  }
  return out;
}
