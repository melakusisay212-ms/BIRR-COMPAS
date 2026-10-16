import React, { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button, Card, CategoryIcon, Field, ProgressBar, Row, Screen, Sub, Title } from '../components/UI';
import MonthSwitcher from '../components/MonthSwitcher';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import { addMonths, monthOfIso, todayIso } from '../lib/ethiopian';
import { budgetStatuses, budgetSuggestion, daysLeftInMonth, summarize } from '../lib/analytics';
import { parseAmount } from '../lib/csv';
import type { Category } from '../lib/types';

export default function BudgetsScreen() {
  const t = useTheme();
  const { state, dispatch, money } = useStore();
  const today = todayIso();
  const [ym, setYm] = useState(monthOfIso(today));
  const [editing, setEditing] = useState<Category | null>(null);
  const [value, setValue] = useState('');

  const expenseCats = state.categories.filter((c) => c.kind === 'expense');
  const statuses = useMemo(() => budgetStatuses(state.transactions, state.categories, state.budgets, ym), [state, ym]);
  const sum = useMemo(() => summarize(state.transactions, ym.year, ym.month), [state.transactions, ym]);
  const prev = useMemo(() => { const p = addMonths(ym, -1); return summarize(state.transactions, p.year, p.month); }, [state.transactions, ym]);
  const left = daysLeftInMonth(ym, today);
  const totalLimit = statuses.reduce((a, s) => a + s.limit, 0);

  const open = (c: Category) => {
    setEditing(c);
    const b = state.budgets.find((x) => x.categoryId === c.id);
    setValue(b ? String(b.limit) : '');
  };
  const save = () => {
    if (!editing) return;
    const n = parseAmount(value);
    dispatch({ type: 'setBudget', categoryId: editing.id, limit: n && n > 0 ? Math.round(n * 100) / 100 : null });
    setEditing(null);
  };

  return (
    <Screen>
      <MonthSwitcher value={ym} onChange={setYm} />
      <Card>
        <Sub>Total monthly budget</Sub>
        <Text style={{ color: t.text, fontSize: 26, fontWeight: '800' }}>{money(totalLimit)}</Text>
        <Sub>Limits repeat every Ethiopian month. Alerts fire at 80% and 100%.</Sub>
      </Card>

      {expenseCats.map((c) => {
        const st = statuses.find((s) => s.category.id === c.id);
        const spent = sum.byCategory[c.id] ?? 0;
        return (
          <Pressable key={c.id} onPress={() => open(c)}>
            <Card>
              <Row>
                <CategoryIcon category={c} size={36} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: t.text, fontWeight: '700' }}>{state.settings.language === 'am' && c.nameAm ? c.nameAm : c.name}</Text>
                  <Sub>{st ? `${money(st.spent)} of ${money(st.limit)}` : `${money(spent)} spent · tap to set a limit`}</Sub>
                </View>
                {st ? <Text style={{ color: st.kind === 'over' ? t.danger : st.kind === 'warn' ? t.warn : t.sub, fontWeight: '700' }}>{Math.round(st.ratio * 100)}%</Text> : null}
              </Row>
              {st ? (
                <View style={{ marginTop: 12 }}>
                  <ProgressBar ratio={st.ratio} />
                  {st.kind !== 'ok' ? <Text style={{ color: st.kind === 'over' ? t.danger : t.warn, marginTop: 8, lineHeight: 19 }}>{budgetSuggestion(st, statuses, left, money)}</Text> : null}
                </View>
              ) : null}
            </Card>
          </Pressable>
        );
      })}

      <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' }}>
          <View style={{ backgroundColor: t.card, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            <Title>Monthly limit: {editing?.name}</Title>
            <Field label="Limit per month" value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder="0.00" autoFocus />
            {editing && (prev.byCategory[editing.id] ?? 0) > 0 ? (
              <Button kind="ghost" title={`Use last month's spending (${money(prev.byCategory[editing.id])})`} onPress={() => setValue(String(Math.round(prev.byCategory[editing.id])))} style={{ marginBottom: 10 }} />
            ) : null}
            <Row>
              <Button title="Save" onPress={save} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Remove" kind="danger" onPress={() => { dispatch({ type: 'setBudget', categoryId: editing!.id, limit: null }); setEditing(null); }} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Cancel" kind="ghost" onPress={() => setEditing(null)} style={{ flex: 1 }} />
            </Row>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
