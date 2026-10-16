# Birr Compass

A personal finance app for Android and iOS (React Native + Expo, TypeScript) built around the **Ethiopian calendar**.
Budget months are Ethiopian months (Meskerem to Pagume), dates are entered and shown as Ethiopian dates, and
Gregorian dates are shown alongside as an option.

## Screens

| Screen | What it does |
| --- | --- |
| Dashboard | Month income, spending, net, balance, budget health, and proactive insights (no navigation needed) |
| Transactions | Manual entry, CSV import, auto-categorization, search, filters |
| Budgets | Per-category monthly limits, progress bars with an 80% tick, actionable suggestions |
| Analysis | Category breakdown, six-month trend, month-over-month comparison |
| Goals | Savings targets, contributions, completion forecast, deadline pace |
| Settings | Language (English / Amharic month names), currency, alerts, categories, bank sync, export, delete |

## Run it

```bash
npm install
npx expo install --fix     # aligns native package versions with the installed Expo SDK
npm test                   # calendar, CSV, analytics and alert logic (Node 22+)
npx expo start             # press a for Android, i for iOS, or scan the QR code in Expo Go
```

Note: `expo-notifications` local alerts work in Expo Go for basic use; for production use a development build.

## Ground rules, and how they are met

- **Data stays on the device.** Everything lives in on-device storage (AsyncStorage). No accounts, no analytics, no servers.
  The only code path that can touch the network is bank sync, which is off by default, requires an explicit
  acknowledgement screen, shows exactly what leaves the device, and writes every request to a visible log
  *before* sending it.
- **Currency follows the device locale** via `Intl.NumberFormat` and `expo-localization`
  (override available in Settings).
- **Budget alerts at 80% and 100%** fire once per category per Ethiopian month, as an in-app insight and an optional
  local notification. Each alert carries an action: a per-day spending allowance at 80%, and at 100% a
  pause/raise suggestion plus a reallocation from a category that has room.
- **Insights surface proactively** on the dashboard: budget warnings, projected overspend pace, category surges versus
  last month, strong savings months, goals falling behind.

## Ethiopian calendar

`src/lib/ethiopian.ts` is a dependency-free Julian-day-based converter (13 months, Pagume 5 or 6 days, leap year when
`year % 4 === 3`). Transactions are stored with Gregorian ISO dates and converted for display and for month
boundaries, so exports stay portable. Tests cover new-year dates 2016 to 2020, Meskel, Genna, Timkat, Adwa,
leap Pagume, and 40-year round trips.

CSV import accepts dates in either calendar (choose on the import screen), single-amount or debit/credit columns,
and auto-categorizes using keywords such as Ethio Telecom, Telebirr, Shoa, Kaldi, ride-hailing, rent, salary,
equb and idir.

## Bank integration

Ethiopian banks do not publish a common open-banking API, so `src/lib/bank.ts` defines a `BankProvider` interface with:

- `DemoBankProvider`: local sample data, no network.
- `RestBankProvider`: talks to a bridge you host or trust. It expects `GET {baseUrl}/transactions?since=YYYY-MM-DD`
  returning `[{ "id": "...", "date": "YYYY-MM-DD", "amount": -150.0, "description": "..." }]`, where negative amounts are spending.

The bridge token is held in memory only. Before shipping, add `expo-secure-store` if you want to persist it.

## Project layout

```
App.tsx                      navigation, alert watcher
src/lib/ethiopian.ts         calendar engine
src/lib/analytics.ts         summaries, budget status, insights, goal forecast, alerts
src/lib/csv.ts, categorize.ts, dedupe.ts   import pipeline
src/lib/store.tsx            state + persistence
src/lib/bank.ts, notify.ts, format.ts, i18n.ts, theme.ts
src/components/              shared UI, month switcher, Ethiopian date picker
src/screens/                 one file per screen
```

## Push to GitHub

```bash
git init && git add . && git commit -m "Birr Compass: initial commit"
git branch -M main
git remote add origin https://github.com/<you>/birr-compass.git
git push -u origin main
```
