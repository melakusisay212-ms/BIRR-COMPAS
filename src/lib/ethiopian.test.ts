import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ethToIso, isoToEth, daysInMonth, isLeap, addMonths, monthRange, isValidEth, weekdayIndex } from './ethiopian';

test('Ethiopian new year lands on the right Gregorian day', () => {
  assert.equal(ethToIso({ year: 2016, month: 1, day: 1 }), '2023-09-12'); // follows leap year 2015
  assert.equal(ethToIso({ year: 2017, month: 1, day: 1 }), '2024-09-11');
  assert.equal(ethToIso({ year: 2018, month: 1, day: 1 }), '2025-09-11');
  assert.equal(ethToIso({ year: 2019, month: 1, day: 1 }), '2026-09-11');
  assert.equal(ethToIso({ year: 2020, month: 1, day: 1 }), '2027-09-12'); // follows leap year 2019
});

test('well-known holidays', () => {
  assert.equal(ethToIso({ year: 2018, month: 1, day: 17 }), '2025-09-27'); // Meskel
  assert.equal(ethToIso({ year: 2017, month: 4, day: 29 }), '2025-01-07'); // Genna
  assert.equal(ethToIso({ year: 2017, month: 5, day: 11 }), '2025-01-19'); // Timkat
  assert.equal(ethToIso({ year: 2017, month: 6, day: 23 }), '2025-03-02'); // Adwa
});

test('today in the Ethiopian calendar', () => {
  assert.deepEqual(isoToEth('2026-10-16'), { year: 2019, month: 2, day: 6 });
});

test('round trip over 40 years', () => {
  for (let i = 0; i < 365 * 40; i += 3) {
    const iso = new Date(Date.UTC(2000, 0, 1 + i)).toISOString().slice(0, 10);
    assert.equal(ethToIso(isoToEth(iso)), iso);
  }
});

test('Pagume length and leap years', () => {
  assert.equal(isLeap(2015), true);
  assert.equal(isLeap(2018), false);
  assert.equal(daysInMonth(2015, 13), 6);
  assert.equal(daysInMonth(2018, 13), 5);
  assert.equal(isValidEth({ year: 2018, month: 13, day: 6 }), false);
  assert.equal(ethToIso({ year: 2015, month: 13, day: 6 }), '2023-09-11');
});

test('13-month arithmetic and ranges', () => {
  assert.deepEqual(addMonths({ year: 2018, month: 1 }, -1), { year: 2017, month: 13 });
  assert.deepEqual(addMonths({ year: 2018, month: 13 }, 1), { year: 2019, month: 1 });
  assert.deepEqual(monthRange(2019, 2), { start: '2026-10-11', end: '2026-11-09' });
});

test('weekday', () => {
  assert.equal(weekdayIndex('2026-10-16'), 5); // Friday
});
