import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';
import { EthDate, addDays, daysInMonth, ethToIso, isoToEth, monthName, todayIso, weekdayName, Lang } from '../lib/ethiopian';
import { gregorianLabel } from '../lib/format';
import { Chip, Sub } from './UI';

function Stepper({ label, value, onMinus, onPlus }: { label: string; value: string; onMinus: () => void; onPlus: () => void }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Sub>{label}</Sub>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <Pressable onPress={onMinus} hitSlop={8} accessibilityLabel={`${label} down`}><Ionicons name="remove-circle-outline" size={26} color={t.primary} /></Pressable>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 15, minWidth: 74, textAlign: 'center' }}>{value}</Text>
        <Pressable onPress={onPlus} hitSlop={8} accessibilityLabel={`${label} up`}><Ionicons name="add-circle-outline" size={26} color={t.primary} /></Pressable>
      </View>
    </View>
  );
}

// Picks a date in the Ethiopian calendar; value/onChange use Gregorian ISO for storage.
export default function EthiopianDatePicker({ value, onChange, lang, showGregorian = true }: { value: string; onChange: (iso: string) => void; lang: Lang; showGregorian?: boolean }) {
  const t = useTheme();
  const e = isoToEth(value);
  const set = (patch: Partial<EthDate>) => {
    const n = { ...e, ...patch };
    n.day = Math.min(n.day, daysInMonth(n.year, n.month));
    onChange(ethToIso(n));
  };
  const dim = daysInMonth(e.year, e.month);
  return (
    <View style={{ marginBottom: 12 }}>
      <Sub style={{ marginBottom: 6 }}>Date (Ethiopian calendar)</Sub>
      <View style={{ flexDirection: 'row' }}>
        <Stepper label="Day" value={String(e.day)} onMinus={() => set({ day: e.day <= 1 ? dim : e.day - 1 })} onPlus={() => set({ day: e.day >= dim ? 1 : e.day + 1 })} />
        <Stepper label="Month" value={monthName(e.month, lang)} onMinus={() => set({ month: e.month <= 1 ? 13 : e.month - 1 })} onPlus={() => set({ month: e.month >= 13 ? 1 : e.month + 1 })} />
        <Stepper label="Year" value={String(e.year)} onMinus={() => set({ year: e.year - 1 })} onPlus={() => set({ year: e.year + 1 })} />
      </View>
      <Text style={{ color: t.sub, textAlign: 'center', marginTop: 8, fontSize: 12 }}>
        {weekdayName(value, lang)}{showGregorian ? ` · ${gregorianLabel(value)}` : ''}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
        <Chip label="Today" onPress={() => onChange(todayIso())} />
        <Chip label="Yesterday" onPress={() => onChange(addDays(todayIso(), -1))} />
      </View>
    </View>
  );
}
