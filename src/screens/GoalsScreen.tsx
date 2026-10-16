import React, { useState } from 'react';
import { Alert, Modal, Text, View } from 'react-native';
import { Button, Card, Chip, Empty, Field, ProgressBar, Row, Screen, Sub, Title } from '../components/UI';
import EthiopianDatePicker from '../components/EthiopianDatePicker';
import { uid, useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import { addDays, todayIso } from '../lib/ethiopian';
import { formatDate } from '../lib/format';
import { goalForecast } from '../lib/analytics';
import { parseAmount } from '../lib/csv';
import type { Goal } from '../lib/types';

export default function GoalsScreen() {
  const t = useTheme();
  const { state, dispatch, money } = useStore();
  const today = todayIso();
  const [form, setForm] = useState<{ id?: string; name: string; target: string; initial: string; hasDeadline: boolean; deadline: string } | null>(null);
  const [contrib, setContrib] = useState<{ goal: Goal; amount: string; withdraw: boolean } | null>(null);

  const openNew = () => setForm({ name: '', target: '', initial: '', hasDeadline: false, deadline: addDays(today, 180) });
  const openEdit = (g: Goal) => setForm({ id: g.id, name: g.name, target: String(g.target), initial: '', hasDeadline: !!g.deadline, deadline: g.deadline ?? addDays(today, 180) });

  const saveGoal = () => {
    if (!form) return;
    const target = parseAmount(form.target);
    if (!form.name.trim() || !target || target <= 0) return Alert.alert('Missing details', 'Give the goal a name and a target amount.');
    const existing = state.goals.find((g) => g.id === form.id);
    const initial = parseAmount(form.initial);
    const goal: Goal = existing
      ? { ...existing, name: form.name.trim(), target, deadline: form.hasDeadline ? form.deadline : undefined }
      : { id: uid(), name: form.name.trim(), target, deadline: form.hasDeadline ? form.deadline : undefined, createdAt: today, contributions: initial && initial > 0 ? [{ id: uid(), amount: initial, date: today }] : [] };
    dispatch({ type: 'saveGoal', goal });
    setForm(null);
  };

  const saveContribution = () => {
    if (!contrib) return;
    const n = parseAmount(contrib.amount);
    if (!n || n <= 0) return Alert.alert('Enter an amount');
    dispatch({ type: 'contribute', goalId: contrib.goal.id, amount: contrib.withdraw ? -n : n, date: today });
    setContrib(null);
  };

  const confirmDelete = (g: Goal) =>
    Alert.alert(`Delete "${g.name}"?`, 'Its contribution history will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch({ type: 'deleteGoal', id: g.id }) },
    ]);

  return (
    <Screen>
      <Button title="New savings goal" onPress={openNew} style={{ marginBottom: 14 }} />
      {state.goals.length === 0 ? <Empty text="No goals yet. Set a target, then log contributions to see a completion forecast." /> : null}
      {state.goals.map((g) => {
        const f = goalForecast(g, today);
        return (
          <Card key={g.id}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ color: t.text, fontWeight: '800', fontSize: 17, flex: 1 }}>{g.name}</Text>
              <Text style={{ color: f.done ? t.good : t.sub, fontWeight: '700' }}>{f.done ? 'Done 🎉' : `${Math.round(f.pct * 100)}%`}</Text>
            </Row>
            <Text style={{ color: t.text, marginVertical: 6 }}>{money(f.saved)} of {money(g.target)}</Text>
            <ProgressBar ratio={f.pct} marker={false} color={f.done ? t.good : undefined} />
            <View style={{ marginTop: 10 }}>
              {f.done ? <Sub>Goal reached.</Sub> : (
                <>
                  {f.projectedIso ? <Text style={{ color: t.text }}>Forecast: {formatDate(f.projectedIso, state.settings).primary}{state.settings.showGregorian ? ` (${formatDate(f.projectedIso, state.settings).secondary})` : ''}</Text> : <Sub>Add a contribution to see a completion forecast.</Sub>}
                  <Sub>Pace: {money(f.monthlyRate)} / month · {money(f.remaining)} to go</Sub>
                  {g.deadline ? (
                    <Text style={{ color: f.onTrack ? t.good : t.warn, marginTop: 4 }}>
                      Target {formatDate(g.deadline, state.settings).primary}: {f.onTrack ? 'on track' : `save ${money(f.requiredPerMonth ?? 0)} / month to make it`}
                    </Text>
                  ) : null}
                </>
              )}
            </View>
            <Row style={{ marginTop: 12 }}>
              <Button title="Add money" onPress={() => setContrib({ goal: g, amount: '', withdraw: false })} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Edit" kind="ghost" onPress={() => openEdit(g)} style={{ marginRight: 8 }} />
              <Button title="Delete" kind="danger" onPress={() => confirmDelete(g)} />
            </Row>
          </Card>
        );
      })}

      <Modal visible={!!form} animationType="slide" onRequestClose={() => setForm(null)}>
        <Screen>
          <Title>{form?.id ? 'Edit goal' : 'New goal'}</Title>
          <Field label="Name" value={form?.name ?? ''} onChangeText={(v) => setForm((f) => f && { ...f, name: v })} placeholder="e.g. Laptop, Wedding, Emergency fund" />
          <Field label="Target amount" value={form?.target ?? ''} onChangeText={(v) => setForm((f) => f && { ...f, target: v })} keyboardType="decimal-pad" />
          {!form?.id ? <Field label="Already saved (optional)" value={form?.initial ?? ''} onChangeText={(v) => setForm((f) => f && { ...f, initial: v })} keyboardType="decimal-pad" /> : null}
          <Row style={{ marginBottom: 8 }}>
            <Chip label="No deadline" active={!form?.hasDeadline} onPress={() => setForm((f) => f && { ...f, hasDeadline: false })} />
            <Chip label="Set deadline" active={!!form?.hasDeadline} onPress={() => setForm((f) => f && { ...f, hasDeadline: true })} />
          </Row>
          {form?.hasDeadline ? <EthiopianDatePicker value={form.deadline} onChange={(v) => setForm((f) => f && { ...f, deadline: v })} lang={state.settings.language} showGregorian={state.settings.showGregorian} /> : null}
          <Button title="Save goal" onPress={saveGoal} />
          <Button title="Cancel" kind="ghost" onPress={() => setForm(null)} style={{ marginTop: 10 }} />
        </Screen>
      </Modal>

      <Modal visible={!!contrib} transparent animationType="slide" onRequestClose={() => setContrib(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0008' }}>
          <View style={{ backgroundColor: t.card, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            <Title>{contrib?.goal.name}</Title>
            <Row>
              <Chip label="Add" active={!contrib?.withdraw} onPress={() => setContrib((c) => c && { ...c, withdraw: false })} />
              <Chip label="Withdraw" active={!!contrib?.withdraw} onPress={() => setContrib((c) => c && { ...c, withdraw: true })} color={t.danger} />
            </Row>
            <Field label="Amount" value={contrib?.amount ?? ''} onChangeText={(v) => setContrib((c) => c && { ...c, amount: v })} keyboardType="decimal-pad" autoFocus />
            <Row>
              <Button title="Save" onPress={saveContribution} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Cancel" kind="ghost" onPress={() => setContrib(null)} style={{ flex: 1 }} />
            </Row>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
