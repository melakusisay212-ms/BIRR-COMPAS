import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Button, Card, Chip, Field, Row, Screen, Sub, Title } from '../components/UI';
import { uid, useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import { DemoBankProvider, RestBankProvider, BankProvider } from '../lib/bank';
import { autoCategorize } from '../lib/categorize';
import { addDays, todayIso } from '../lib/ethiopian';
import { formatDate } from '../lib/format';
import type { Transaction } from '../lib/types';

export default function BankScreen() {
  const t = useTheme();
  const { state, dispatch } = useStore();
  const [ack, setAck] = useState(false);
  const [mode, setMode] = useState<'demo' | 'rest'>('demo');
  const [url, setUrl] = useState('');
  const [token, setToken] = useState(''); // kept in memory only, never persisted
  const [busy, setBusy] = useState(false);
  const enabled = state.settings.bankSyncOptIn;

  const provider: BankProvider | null = mode === 'demo' ? new DemoBankProvider() : url.startsWith('https://') ? new RestBankProvider(url, token) : null;
  const log = (p: string, action: string, detail: string) => dispatch({ type: 'bankLog', entry: { at: new Date().toISOString(), provider: p, action, detail } });

  const sync = async () => {
    if (!provider) return Alert.alert('Enter an https:// bridge URL');
    const since = state.lastBankSync ? addDays(state.lastBankSync, -3) : addDays(todayIso(), -90);
    setBusy(true);
    try {
      log(provider.name, 'request', provider.describeRequest(since)); // logged BEFORE the call
      const rows = await provider.fetchTransactions(since);
      const txs: Transaction[] = rows.map((r) => {
        const type = r.amount < 0 ? 'expense' : 'income';
        return { id: uid(), type, amount: Math.abs(r.amount), note: r.description, date: r.date, categoryId: autoCategorize(r.description, type, state.categories), source: 'bank', externalId: `${provider.id}:${r.id}` };
      });
      dispatch({ type: 'addTxs', txs });
      dispatch({ type: 'bankSynced', at: todayIso() });
      log(provider.name, 'response', `${rows.length} transactions received; duplicates are skipped automatically`);
    } catch (e: any) {
      log(provider.name, 'error', String(e?.message ?? e));
      Alert.alert('Sync failed', String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  if (!enabled) {
    return (
      <Screen>
        <Card>
          <Title>Bank sync is off</Title>
          <Sub style={{ marginBottom: 10 }}>Birr Compass works fully offline. Turning on bank sync lets the app contact a bank data provider that you choose.</Sub>
          <Text style={{ color: t.text, fontWeight: '700', marginBottom: 4 }}>What you should know first</Text>
          <Text style={{ color: t.text, lineHeight: 21 }}>
            • Your existing transactions, budgets and goals are never uploaded.{'\n'}
            • The app sends only an access token and the start date of the sync window to the provider you enter.{'\n'}
            • The provider can see your IP address and the time of each request.{'\n'}
            • Every request is written to a log on this screen before it is made.{'\n'}
            • You can turn this off at any time, which also clears the log.
          </Text>
          <Chip label={ack ? '✓ I understand and want to enable bank sync' : 'I understand and want to enable bank sync'} active={ack} onPress={() => setAck(!ack)} />
          <Button title="Enable bank sync" disabled={!ack} onPress={() => dispatch({ type: 'settings', patch: { bankSyncOptIn: true } })} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Title>Provider</Title>
        <Row>
          <Chip label="Demo data" active={mode === 'demo'} onPress={() => setMode('demo')} />
          <Chip label="Custom bridge" active={mode === 'rest'} onPress={() => setMode('rest')} />
        </Row>
        {mode === 'rest' ? (
          <>
            <Field label="Bridge URL (https only)" value={url} onChangeText={setUrl} autoCapitalize="none" placeholder="https://bridge.example.com" />
            <Field label="Access token (not saved)" value={token} onChangeText={setToken} autoCapitalize="none" secureTextEntry />
          </>
        ) : null}
        <Text style={{ color: t.text, fontWeight: '700', marginTop: 4 }}>What leaves this device</Text>
        {(provider?.disclosure ?? ['Enter a valid https:// URL to see the disclosure.']).map((d, i) => <Sub key={i}>• {d}</Sub>)}
        <Button title={busy ? 'Syncing…' : 'Sync now'} onPress={sync} disabled={busy || !provider} style={{ marginTop: 12 }} />
        {state.lastBankSync ? <Sub style={{ marginTop: 6 }}>Last sync: {formatDate(state.lastBankSync, state.settings).primary}</Sub> : null}
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Title>Transparency log</Title>
          <Button title="Clear" kind="ghost" onPress={() => dispatch({ type: 'clearBankLog' })} />
        </Row>
        {state.bankLog.length === 0 ? <Sub>No requests yet.</Sub> : state.bankLog.map((e, i) => (
          <View key={i} style={{ marginBottom: 8 }}>
            <Sub>{new Date(e.at).toLocaleString()} · {e.action}</Sub>
            <Text style={{ color: e.action === 'error' ? t.danger : t.text }}>{e.detail}</Text>
          </View>
        ))}
      </Card>

      <Button title="Turn off bank sync and clear log" kind="danger" onPress={() => { dispatch({ type: 'settings', patch: { bankSyncOptIn: false } }); dispatch({ type: 'clearBankLog' }); setAck(false); }} />
    </Screen>
  );
}
