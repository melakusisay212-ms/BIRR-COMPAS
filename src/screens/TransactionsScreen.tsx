import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, CategoryIcon, Chip, Empty, Field, Row, Sub } from '../components/UI';
import MonthSwitcher from '../components/MonthSwitcher';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import { monthOfIso, monthRange, todayIso } from '../lib/ethiopian';
import { formatDate } from '../lib/format';
import type { TxType } from '../lib/types';

export default function TransactionsScreen({ navigation }: any) {
  const t = useTheme();
  const { state, money } = useStore();
  const { transactions, categories, settings } = state;
  const [ym, setYm] = useState(monthOfIso(todayIso()));
  const [allTime, setAllTime] = useState(false);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<TxType | 'all'>('all');

  const list = useMemo(() => {
    const r = monthRange(ym.year, ym.month);
    const needle = q.trim().toLowerCase();
    return transactions
      .filter((x) => (allTime || (x.date >= r.start && x.date <= r.end)) && (kind === 'all' || x.type === kind))
      .filter((x) => {
        if (!needle) return true;
        const c = categories.find((k) => k.id === x.categoryId);
        return x.note.toLowerCase().includes(needle) || (c?.name.toLowerCase().includes(needle) ?? false) || (c?.nameAm ?? '').includes(needle) || String(x.amount).includes(needle);
      })
      .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
  }, [transactions, categories, ym, allTime, q, kind]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, padding: 16 }}>
      {allTime ? null : <MonthSwitcher value={ym} onChange={setYm} />}
      <Field placeholder="Search note, category or amount" value={q} onChangeText={setQ} autoCapitalize="none" />
      <Row style={{ flexWrap: 'wrap' }}>
        <Chip label="All" active={kind === 'all'} onPress={() => setKind('all')} />
        <Chip label="Spending" active={kind === 'expense'} onPress={() => setKind('expense')} />
        <Chip label="Income" active={kind === 'income'} onPress={() => setKind('income')} />
        <Chip label={allTime ? 'All time ✓' : 'All time'} active={allTime} onPress={() => setAllTime(!allTime)} color={t.sub} />
      </Row>
      <Row style={{ marginBottom: 10 }}>
        <Button title="Add" onPress={() => navigation.navigate('TxForm')} style={{ flex: 1, marginRight: 8 }} />
        <Button title="Import CSV" kind="ghost" onPress={() => navigation.navigate('Import')} style={{ flex: 1 }} />
      </Row>
      <FlatList
        data={list}
        keyExtractor={(x) => x.id}
        ListEmptyComponent={<Empty text={q ? 'No transactions match your search.' : 'No transactions in this period.'} />}
        renderItem={({ item: x }) => {
          const c = categories.find((k) => k.id === x.categoryId);
          const d = formatDate(x.date, settings);
          return (
            <Pressable onPress={() => navigation.navigate('TxForm', { id: x.id })} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: t.border }}>
              <CategoryIcon category={c} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: t.text, fontWeight: '600' }} numberOfLines={1}>{x.note || c?.name}</Text>
                <Sub>{c?.name} · {d.primary}{d.secondary ? ` (${d.secondary})` : ''}</Sub>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: x.type === 'income' ? t.good : t.text, fontWeight: '700' }}>{x.type === 'income' ? '+' : '−'}{money(x.amount)}</Text>
                {x.source !== 'manual' ? <Ionicons name={x.source === 'bank' ? 'business' : 'document-text'} size={12} color={t.sub} /> : null}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
