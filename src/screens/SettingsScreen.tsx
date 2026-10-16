import React from 'react';
import { Alert, Pressable, Share, Switch, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Chip, Field, Row, Screen, Sub, Title } from '../components/UI';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import { ensureNotificationPermission } from '../lib/notify';
import { deviceLocale } from '../lib/format';

function NavRow({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
      <Ionicons name={icon as any} size={20} color={t.primary} />
      <Text style={{ color: t.text, flex: 1, marginLeft: 12, fontSize: 16 }}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={t.sub} />
    </Pressable>
  );
}

export default function SettingsScreen({ navigation }: any) {
  const t = useTheme();
  const { state, dispatch } = useStore();
  const s = state.settings;
  const loc = deviceLocale();

  const toggleNotifications = async (on: boolean) => {
    if (on && !(await ensureNotificationPermission())) return Alert.alert('Notifications are blocked', 'Allow notifications for this app in system settings to get budget alerts.');
    dispatch({ type: 'settings', patch: { notifications: on } });
  };

  const exportData = () => {
    const { hydrated, ...data } = state;
    Share.share({ message: JSON.stringify(data, null, 2), title: 'Birr Compass export' }).catch(() => {});
  };

  const wipe = () =>
    Alert.alert('Delete all data?', 'Transactions, budgets, goals and settings on this device will be erased. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete everything', style: 'destructive', onPress: () => dispatch({ type: 'wipe' }) },
    ]);

  return (
    <Screen>
      <Card>
        <Title>Display</Title>
        <Sub style={{ marginBottom: 6 }}>Month and weekday names</Sub>
        <Row>
          <Chip label="English" active={s.language === 'en'} onPress={() => dispatch({ type: 'settings', patch: { language: 'en' } })} />
          <Chip label="አማርኛ" active={s.language === 'am'} onPress={() => dispatch({ type: 'settings', patch: { language: 'am' } })} />
        </Row>
        <Row style={{ justifyContent: 'space-between', marginVertical: 6 }}>
          <Text style={{ color: t.text, flex: 1 }}>Show Gregorian dates alongside</Text>
          <Switch value={s.showGregorian} onValueChange={(v) => dispatch({ type: 'settings', patch: { showGregorian: v } })} />
        </Row>
        <Field label={`Currency code (device default: ${loc.currency})`} value={s.currency ?? ''} onChangeText={(v) => dispatch({ type: 'settings', patch: { currency: v.trim().toUpperCase().slice(0, 3) || undefined } })} autoCapitalize="characters" placeholder={loc.currency} maxLength={3} />
        <Sub>Amounts are formatted for your device locale ({loc.tag}).</Sub>
      </Card>

      <Card>
        <Title>Alerts</Title>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={{ color: t.text, flex: 1 }}>Notify me at 80% and 100% of a budget</Text>
          <Switch value={s.notifications} onValueChange={toggleNotifications} />
        </Row>
        <Sub style={{ marginTop: 6 }}>Alerts always appear in the app. Notifications are generated on this device.</Sub>
      </Card>

      <Card>
        <Title>Data</Title>
        <NavRow icon="pricetags" label="Categories" onPress={() => navigation.navigate('Categories')} />
        <NavRow icon="document-text" label="Import CSV statement" onPress={() => navigation.navigate('Import')} />
        <NavRow icon="business" label={s.bankSyncOptIn ? 'Bank sync (enabled)' : 'Bank sync (off)'} onPress={() => navigation.navigate('Bank')} />
        <NavRow icon="share-outline" label="Export my data (JSON)" onPress={exportData} />
      </Card>

      <Card>
        <Title>Privacy</Title>
        <Sub>Your financial data is stored only on this device. Nothing is uploaded, and there are no analytics or accounts. The only time data can leave the device is when you turn on bank sync, and every request is listed in its transparency log.</Sub>
        <Button title="Delete all my data" kind="danger" onPress={wipe} style={{ marginTop: 12 }} />
      </Card>
    </Screen>
  );
}
