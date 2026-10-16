// Bank sync is OPT-IN. Ethiopian banks do not publish a common open-banking API, so this file defines
// the adapter interface plus two implementations:
//   - DemoBankProvider: generates sample data locally (no network).
//   - RestBankProvider: talks to a bridge you host/trust (aggregator, bank API wrapper, etc.).
// Every network call is written to the visible transparency log (see BankScreen).
import { addDays, todayIso } from './ethiopian';

export interface BankTx { id: string; date: string; amount: number; description: string } // amount < 0 = money out

export interface BankProvider {
  id: string;
  name: string;
  /** Plain-language list of exactly what leaves the device. */
  disclosure: string[];
  /** Human-readable description of the request, written to the transparency log before it is made. */
  describeRequest(since: string): string;
  fetchTransactions(since: string): Promise<BankTx[]>;
}

export class DemoBankProvider implements BankProvider {
  id = 'demo';
  name = 'Demo bank (sample data)';
  disclosure = ['Nothing. Demo data is generated on this device and no network request is made.'];
  describeRequest(since: string) { return `Generate sample transactions since ${since} (local, no network)`; }
  async fetchTransactions(since: string): Promise<BankTx[]> {
    const rows: [string, number, string][] = [['Ethio Telecom airtime', -150, 'a'], ['Shoa Supermarket', -820, 'b'], ['Ride to Bole', -240, 'c'], ['Salary deposit', 15000, 'd'], ['Kaldi Coffee', -95, 'e'], ['Pharmacy', -310, 'f']];
    const today = todayIso();
    return rows
      .map(([description, amount, k], i) => ({ id: `demo-${today}-${k}`, date: addDays(today, -(i * 3 + 1)), amount, description }))
      .filter((r) => r.date >= since);
  }
}

export class RestBankProvider implements BankProvider {
  id = 'rest';
  name = 'Custom bridge (REST)';
  constructor(private baseUrl: string, private token: string) {}
  get disclosure() {
    return [
      `Your access token, sent to ${this.baseUrl} as a Bearer header.`,
      'The start date of the sync window.',
      'Your device IP address and request time (visible to that server).',
      'Your existing transactions are NOT uploaded. Only the response is read.',
    ];
  }
  describeRequest(since: string) { return `GET ${this.baseUrl}/transactions?since=${since} (Authorization: Bearer ••••)`; }
  async fetchTransactions(since: string): Promise<BankTx[]> {
    const res = await fetch(`${this.baseUrl.replace(/\/$/, '')}/transactions?since=${encodeURIComponent(since)}`, {
      headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Bridge returned HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Bridge response must be a JSON array');
    return data
      .filter((r) => r && typeof r.id !== 'undefined' && typeof r.date === 'string' && typeof r.amount === 'number')
      .map((r) => ({ id: String(r.id), date: String(r.date).slice(0, 10), amount: r.amount, description: String(r.description ?? '') }));
  }
}
