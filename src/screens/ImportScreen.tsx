import React, { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Button, Card, Chip, Field, Row, Screen, Sub, Title } from '../components/UI';
import { uid, useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import { importCsv } from '../lib/csv';
import { dedupeIncoming } from '../lib/dedupe';
import { formatDate } from '../lib/format';
import type { Transaction } from '../lib/types';

export default function ImportScreen({ navigation }: any) {
  const t = useTheme();
  const { state, dispatch, money } = useStore();
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [ethiopian, setEthiopian] = useState(true);
  const [positiveIsExpense, setPositiveIsExpense] = useState(false);

  const result = useMemo(() => (text.trim() ? importCsv(text, { ethiopianDates: ethiopian, positiveIsExpense, categories: state.categories }) : null), [text, ethiopian, positiveIsExpense, state.categories]);
  const incoming: Transaction[] = useMemo(
    () => (result?.rows ?? []).map((r) => ({ id: uid(), type: r.type, amount: r.amount, categoryId: r.categoryId, note: r.note, date: r.date, source: 'import' as const })),
    [result],
  );
  const fresh = useMemo(() => dedupeIncoming(state.transactions, incoming), [state.transactions, incoming]);

  const pick = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'], copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      setFileName(asset.name);
      setText(await (await fetch(asset.uri)).text()); // read locally; nothing is uploaded
    } catch (e: any) {
      Alert.alert('Could not read file', String(e?.message ?? e));
    }
  };

  const commit = () => {
    dispatch({ type: 'addTxs', txs: fresh });
    Alert.alert('Import complete', `${fresh.length} added, ${incoming.length - fresh.length} duplicates skipped.`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
  };

  return (
    <Screen>
      <Card>
        <Title>Import a statement</Title>
        <Sub style={{ marginBottom: 10 }}>CSV with a date column plus either an amount column or debit/credit columns. Files are read on this device only.</Sub>
        <Button title={fileName ? `Chosen: ${fileName}` : 'Choose CSV file'} onPress={pick} />
        <Sub style={{ marginVertical: 10 }}>…or paste CSV text:</Sub>
        <Field value={text} onChangeText={setText} multiline numberOfLines={5} style={{ minHeight: 100, textAlignVertical: 'top' }} placeholder={'Date,Description,Amount\n2019-02-06,Shoa Supermarket,-820'} autoCapitalize="none" />
        <Sub style={{ marginBottom: 6 }}>Dates in the file are…</Sub>
        <Row>
          <Chip label="Ethiopian calendar" active={ethiopian} onPress={() => setEthiopian(true)} />
          <Chip label="Gregorian" active={!ethiopian} onPress={() => setEthiopian(false)} />
        </Row>
        <Sub style={{ marginBottom: 6 }}>Single amount column: positive numbers are…</Sub>
        <Row>
          <Chip label="Income" active={!positiveIsExpense} onPress={() => setPositiveIsExpense(false)} />
          <Chip label="Spending" active={positiveIsExpense} onPress={() => setPositiveIsExpense(true)} />
        </Row>
      </Card>

      {result ? (
        <Card>
          <Title>Preview</Title>
          <Text style={{ color: t.text, marginBottom: 6 }}>{result.rows.length} rows read · {fresh.length} new · {result.rows.length - fresh.length} duplicates</Text>
          {result.errors.length ? <Text style={{ color: t.warn, marginBottom: 6 }}>{result.errors.length} problem row(s). First: {result.errors[0]}</Text> : null}
          {incoming.slice(0, 5).map((x, i) => (
            <View key={i} style={{ paddingVertical: 4 }}>
              <Text style={{ color: t.text }}>{x.type === 'income' ? '+' : '−'}{money(x.amount)} · {state.categories.find((c) => c.id === x.categoryId)?.name}</Text>
              <Sub>{formatDate(x.date, state.settings).primary} · {x.note || '(no description)'}</Sub>
            </View>
          ))}
          <Button title={`Import ${fresh.length} transactions`} onPress={commit} disabled={fresh.length === 0} style={{ marginTop: 12 }} />
        </Card>
      ) : null}
    </Screen>
  );
}
