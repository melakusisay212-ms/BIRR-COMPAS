import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Screen, Field, Button, Chip, Row, Sub } from '../components/UI';
import EthiopianDatePicker from '../components/EthiopianDatePicker';
import { uid, useStore } from '../lib/store';
import { todayIso } from '../lib/ethiopian';
import { autoCategorize } from '../lib/categorize';
import { parseAmount } from '../lib/csv';
import type { TxType } from '../lib/types';

export default function TransactionFormScreen({ navigation, route }: any) {
  const { state, dispatch } = useStore();
  const editing = route.params?.id ? state.transactions.find((x) => x.id === route.params.id) : undefined;
  const [type, setType] = useState<TxType>(editing?.type ?? 'expense');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [date, setDate] = useState(editing?.date ?? todayIso());
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? '');
  const [manual, setManual] = useState(!!editing);
  const cats = state.categories.filter((c) => c.kind === type);

  // Auto-categorize from the note until the user picks a category themselves.
  useEffect(() => {
    if (!manual) setCategoryId(autoCategorize(note, type, state.categories));
  }, [note, type, manual, state.categories]);

  const switchType = (next: TxType) => {
    setType(next);
    if (manual && state.categories.find((c) => c.id === categoryId)?.kind !== next) setManual(false);
  };

  const save = () => {
    const n = parseAmount(amount);
    if (n === null || Math.abs(n) <= 0) return Alert.alert('Enter an amount', 'The amount must be greater than zero.');
    const tx = { id: editing?.id ?? uid(), type, amount: Math.round(Math.abs(n) * 100) / 100, categoryId, note: note.trim(), date, source: editing?.source ?? ('manual' as const), externalId: editing?.externalId };
    dispatch({ type: editing ? 'updateTx' : 'addTx', tx });
    navigation.goBack();
  };

  const remove = () =>
    Alert.alert('Delete transaction?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { dispatch({ type: 'deleteTx', id: editing!.id }); navigation.goBack(); } },
    ]);

  return (
    <Screen>
      <Row style={{ marginBottom: 8 }}>
        <Chip label="Spending" active={type === 'expense'} onPress={() => switchType('expense')} />
        <Chip label="Income" active={type === 'income'} onPress={() => switchType('income')} />
      </Row>
      <Field label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" autoFocus={!editing} />
      <Field label="Note" value={note} onChangeText={setNote} placeholder="e.g. Shoa supermarket" />
      <Sub style={{ marginBottom: 6 }}>Category {manual ? '' : '(auto)'}</Sub>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
        {cats.map((c) => (
          <Chip key={c.id} label={state.settings.language === 'am' && c.nameAm ? c.nameAm : c.name} color={c.color} active={categoryId === c.id} onPress={() => { setCategoryId(c.id); setManual(true); }} />
        ))}
      </View>
      <EthiopianDatePicker value={date} onChange={setDate} lang={state.settings.language} showGregorian={state.settings.showGregorian} />
      <Button title={editing ? 'Save changes' : 'Add transaction'} onPress={save} />
      {editing ? <Button title="Delete" kind="danger" onPress={remove} style={{ marginTop: 10 }} /> : null}
    </Screen>
  );
}
