import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card, CategoryIcon, Empty, InsightCard, Row, Screen, Sub, Title } from '../components/UI';
import MonthSwitcher from '../components/MonthSwitcher';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import { addMonths, monthName, monthOfIso, todayIso } from '../lib/ethiopian';
import { buildInsights, monthlyTrend, summarize } from '../lib/analytics';

export default function AnalysisScreen() {
  const t = useTheme();
  const { state, money } = useStore();
  const today = todayIso();
  const [ym, setYm] = useState(monthOfIso(today));
  const { transactions: txs, categories, budgets, goals, settings } = state;

  const cur = useMemo(() => summarize(txs, ym.year, ym.month), [txs, ym]);
  const prevYm = addMonths(ym, -1);
  const prev = useMemo(() => summarize(txs, prevYm.year, prevYm.month), [txs, ym]);
  const trend = useMemo(() => monthlyTrend(txs, ym, 6), [txs, ym]);
  const insights = useMemo(() => buildInsights({ txs, categories, budgets, goals, ym, today, fmt: money }), [txs, categories, budgets, goals, ym, today, money]);

  const rows = useMemo(
    () => categories.filter((c) => c.kind === 'expense').map((c) => ({ c, now: cur.byCategory[c.id] ?? 0, before: prev.byCategory[c.id] ?? 0 })).filter((r) => r.now > 0 || r.before > 0).sort((a, b) => b.now - a.now),
    [categories, cur, prev],
  );
  const maxNow = Math.max(1, ...rows.map((r) => r.now));
  const maxTrend = Math.max(1, ...trend.flatMap((m) => [m.income, m.expense]));
  const delta = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 100) : null);
  const spendDelta = delta(cur.expense, prev.expense);

  return (
    <Screen>
      <MonthSwitcher value={ym} onChange={setYm} />
      {insights.slice(0, 3).map((i) => <InsightCard key={i.id} insight={i} />)}

      <Card>
        <Sub>Spending this month</Sub>
        <Text style={{ color: t.text, fontSize: 26, fontWeight: '800' }}>{money(cur.expense)}</Text>
        <Text style={{ color: spendDelta === null ? t.sub : spendDelta > 0 ? t.danger : t.good, marginTop: 2 }}>
          {spendDelta === null ? 'No spending last month to compare' : `${spendDelta > 0 ? '▲' : '▼'} ${Math.abs(spendDelta)}% vs ${monthName(prevYm.month, settings.language)} (${money(prev.expense)})`}
        </Text>
      </Card>

      <Card>
        <Title>Where it went</Title>
        {rows.filter((r) => r.now > 0).length === 0 ? <Empty text="No spending this month." /> : rows.filter((r) => r.now > 0).map((r) => (
          <View key={r.c.id} style={{ marginBottom: 12 }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
              <Row><CategoryIcon category={r.c} size={26} /><Text style={{ color: t.text, marginLeft: 8, fontWeight: '600' }}>{r.c.name}</Text></Row>
              <Text style={{ color: t.text }}>{money(r.now)} · {Math.round((r.now / Math.max(1, cur.expense)) * 100)}%</Text>
            </Row>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: t.border }}>
              <View style={{ width: `${(r.now / maxNow) * 100}%`, height: 8, borderRadius: 4, backgroundColor: r.c.color }} />
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <Title>Six-month trend</Title>
        <Row style={{ alignItems: 'flex-end', justifyContent: 'space-between', height: 140 }}>
          {trend.map((m) => (
            <Pressable key={`${m.year}-${m.month}`} onPress={() => setYm({ year: m.year, month: m.month })} style={{ alignItems: 'center', flex: 1 }}>
              <Row style={{ alignItems: 'flex-end', height: 120 }}>
                <View style={{ width: 11, height: Math.max(2, (m.income / maxTrend) * 110), backgroundColor: t.good, borderRadius: 3, marginRight: 2 }} />
                <View style={{ width: 11, height: Math.max(2, (m.expense / maxTrend) * 110), backgroundColor: t.danger, borderRadius: 3 }} />
              </Row>
              <Text style={{ color: m.year === ym.year && m.month === ym.month ? t.text : t.sub, fontSize: 10, fontWeight: m.year === ym.year && m.month === ym.month ? '800' : '400', marginTop: 4 }}>
                {monthName(m.month, settings.language).slice(0, 3)}
              </Text>
            </Pressable>
          ))}
        </Row>
        <Row style={{ marginTop: 8 }}>
          <Text style={{ color: t.good, marginRight: 14 }}>■ Income</Text>
          <Text style={{ color: t.danger }}>■ Spending</Text>
        </Row>
      </Card>

      <Card>
        <Title>Month over month</Title>
        {rows.length === 0 ? <Empty text="Nothing to compare yet." /> : rows.map((r) => {
          const d = delta(r.now, r.before);
          return (
            <Row key={r.c.id} style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ color: t.text, flex: 1 }}>{r.c.name}</Text>
              <Text style={{ color: t.sub, marginRight: 10 }}>{money(r.before)} → {money(r.now)}</Text>
              <Text style={{ color: d === null ? t.sub : d > 0 ? t.danger : t.good, fontWeight: '700', minWidth: 52, textAlign: 'right' }}>{d === null ? 'new' : `${d > 0 ? '+' : ''}${d}%`}</Text>
            </Row>
          );
        })}
      </Card>
    </Screen>
  );
}
