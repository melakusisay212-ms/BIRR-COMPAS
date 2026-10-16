import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Title, Sub, ProgressBar, InsightCard, CategoryIcon, Row, Empty } from '../components/UI';
import MonthSwitcher from '../components/MonthSwitcher';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import { buildInsights, budgetStatuses, summarize } from '../lib/analytics';
import { monthOfIso, todayIso } from '../lib/ethiopian';
import { formatDate } from '../lib/format';

export default function DashboardScreen({ navigation }: any) {
  const t = useTheme();
  const { state, money } = useStore();
  const today = todayIso();
  const [ym, setYm] = useState(monthOfIso(today));
  const { transactions: txs, categories, budgets, goals, settings } = state;

  const sum = useMemo(() => summarize(txs, ym.year, ym.month), [txs, ym]);
  const statuses = useMemo(() => budgetStatuses(txs, categories, budgets, ym), [txs, categories, budgets, ym]);
  const insights = useMemo(() => buildInsights({ txs, categories, budgets, goals, ym, today, fmt: money }), [txs, categories, budgets, goals, ym, today, money]);
  const balance = useMemo(() => txs.reduce((a, x) => a + (x.type === 'income' ? x.amount : -x.amount), 0), [txs]);

  const totalLimit = statuses.reduce((a, s) => a + s.limit, 0);
  const totalSpent = statuses.reduce((a, s) => a + s.spent, 0);
  const counts = { ok: 0, warn: 0, over: 0 };
  statuses.forEach((s) => counts[s.kind]++);
  const recentTxs = [...txs].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);

  return (
    <Screen>
      <MonthSwitcher value={ym} onChange={setYm} />

      {/* Proactive insights: visible without any navigation */}
      {insights.map((i) => <InsightCard key={i.id} insight={i} />)}

      <Card>
        <Sub>Balance (all time)</Sub>
        <Text style={{ color: balance < 0 ? t.danger : t.text, fontSize: 32, fontWeight: '800', marginTop: 2 }}>{money(balance)}</Text>
        <Row style={{ marginTop: 14, justifyContent: 'space-between' }}>
          <View><Sub>Income</Sub><Text style={{ color: t.good, fontWeight: '700', fontSize: 17 }}>{money(sum.income)}</Text></View>
          <View><Sub>Spending</Sub><Text style={{ color: t.danger, fontWeight: '700', fontSize: 17 }}>{money(sum.expense)}</Text></View>
          <View><Sub>Net</Sub><Text style={{ color: sum.net < 0 ? t.danger : t.text, fontWeight: '700', fontSize: 17 }}>{money(sum.net)}</Text></View>
        </Row>
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Title>Budget health</Title>
          <Pressable onPress={() => navigation.navigate('Budgets')}><Text style={{ color: t.primary, fontWeight: '600' }}>Manage</Text></Pressable>
        </Row>
        {statuses.length === 0 ? (
          <Sub>No budgets yet. Set monthly limits per category to see your budget health here.</Sub>
        ) : (
          <>
            <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: t.text }}>{money(totalSpent)} of {money(totalLimit)}</Text>
              <Text style={{ color: t.sub }}>{Math.round((totalSpent / totalLimit) * 100)}%</Text>
            </Row>
            <ProgressBar ratio={totalSpent / totalLimit} />
            <Row style={{ marginTop: 12 }}>
              <Text style={{ color: t.good, marginRight: 14 }}>● {counts.ok} on track</Text>
              <Text style={{ color: t.warn, marginRight: 14 }}>● {counts.warn} near limit</Text>
              <Text style={{ color: t.danger }}>● {counts.over} over</Text>
            </Row>
          </>
        )}
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Title>Recent</Title>
          <Pressable onPress={() => navigation.navigate('Transactions')}><Text style={{ color: t.primary, fontWeight: '600' }}>See all</Text></Pressable>
        </Row>
        {recentTxs.length === 0 ? <Empty text="No transactions yet." /> : recentTxs.map((x) => {
          const c = categories.find((k) => k.id === x.categoryId);
          const d = formatDate(x.date, settings);
          return (
            <Pressable key={x.id} onPress={() => navigation.navigate('TxForm', { id: x.id })} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
              <CategoryIcon category={c} size={36} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: t.text, fontWeight: '600' }} numberOfLines={1}>{x.note || c?.name}</Text>
                <Sub>{d.primary}</Sub>
              </View>
              <Text style={{ color: x.type === 'income' ? t.good : t.text, fontWeight: '700' }}>{x.type === 'income' ? '+' : '−'}{money(x.amount)}</Text>
            </Pressable>
          );
        })}
      </Card>

      <Pressable onPress={() => navigation.navigate('TxForm')} style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: t.primary, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 28 }}>
        <Ionicons name="add" size={22} color={t.onPrimary} />
        <Text style={{ color: t.onPrimary, fontWeight: '700', marginLeft: 6 }}>Add transaction</Text>
      </Pressable>
    </Screen>
  );
}
