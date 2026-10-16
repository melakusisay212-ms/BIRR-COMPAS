import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';
import { useStore } from '../lib/store';
import { YearMonth, addMonths, monthName, monthRange } from '../lib/ethiopian';
import { gregorianLabel } from '../lib/format';

export default function MonthSwitcher({ value, onChange }: { value: YearMonth; onChange: (v: YearMonth) => void }) {
  const t = useTheme();
  const { state } = useStore();
  const { language, showGregorian } = state.settings;
  const r = monthRange(value.year, value.month);
  const btn = { padding: 10 } as const;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <Pressable style={btn} onPress={() => onChange(addMonths(value, -1))} accessibilityLabel="Previous month">
        <Ionicons name="chevron-back" size={22} color={t.text} />
      </Pressable>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: t.text, fontSize: 20, fontWeight: '800' }}>{monthName(value.month, language)} {value.year}</Text>
        {showGregorian ? <Text style={{ color: t.sub, fontSize: 12 }}>{gregorianLabel(r.start)} – {gregorianLabel(r.end)}</Text> : null}
      </View>
      <Pressable style={btn} onPress={() => onChange(addMonths(value, 1))} accessibilityLabel="Next month">
        <Ionicons name="chevron-forward" size={22} color={t.text} />
      </Pressable>
    </View>
  );
}
