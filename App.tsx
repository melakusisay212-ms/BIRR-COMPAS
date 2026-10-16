import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StoreProvider, useStore } from './src/lib/store';
import { useTheme } from './src/lib/theme';
import { tr } from './src/lib/i18n';
import { pendingAlerts } from './src/lib/analytics';
import { todayIso } from './src/lib/ethiopian';
import { initNotifications, notifyNow } from './src/lib/notify';
import DashboardScreen from './src/screens/DashboardScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import TransactionFormScreen from './src/screens/TransactionFormScreen';
import ImportScreen from './src/screens/ImportScreen';
import BudgetsScreen from './src/screens/BudgetsScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import BankScreen from './src/screens/BankScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Fires budget alerts at 80% and 100% once per category per Ethiopian month.
function AlertWatcher() {
  const { state, dispatch, money } = useStore();
  useEffect(() => {
    if (!state.hydrated) return;
    const alerts = pendingAlerts({ txs: state.transactions, categories: state.categories, budgets: state.budgets, fired: state.alertsFired, today: todayIso(), fmt: money });
    if (alerts.length === 0) return;
    dispatch({ type: 'markAlerts', keys: alerts.flatMap((a) => a.keys) });
    if (state.settings.notifications) alerts.forEach((a) => notifyNow(a.title, a.body));
  }, [state.hydrated, state.transactions, state.budgets]);
  return null;
}

function Tabs() {
  const t = useTheme();
  const { state } = useStore();
  const lang = state.settings.language;
  const icons: Record<string, [string, string]> = { Home: ['home', 'home-outline'], Transactions: ['list', 'list-outline'], Budgets: ['pie-chart', 'pie-chart-outline'], Analysis: ['stats-chart', 'stats-chart-outline'], Goals: ['flag', 'flag-outline'] };
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.sub,
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border },
        headerStyle: { backgroundColor: t.card },
        headerTintColor: t.text,
        tabBarIcon: ({ focused, color, size }) => <Ionicons name={(icons[route.name][focused ? 0 : 1]) as any} size={size} color={color} />,
        headerRight: () => (
          <Pressable onPress={() => navigation.navigate('Settings')} style={{ marginRight: 14 }} accessibilityLabel="Settings">
            <Ionicons name="settings-outline" size={22} color={t.text} />
          </Pressable>
        ),
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: tr('home', lang), headerTitle: 'Birr Compass' }} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} options={{ title: tr('transactions', lang) }} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} options={{ title: tr('budgets', lang) }} />
      <Tab.Screen name="Analysis" component={AnalysisScreen} options={{ title: tr('analysis', lang) }} />
      <Tab.Screen name="Goals" component={GoalsScreen} options={{ title: tr('goals', lang) }} />
    </Tab.Navigator>
  );
}

function Root() {
  const t = useTheme();
  const base = t.bg === '#0F1210' ? DarkTheme : DefaultTheme;
  const header = { headerStyle: { backgroundColor: t.card }, headerTintColor: t.text };
  useEffect(() => { initNotifications(); }, []);
  return (
    <NavigationContainer theme={{ ...base, colors: { ...base.colors, background: t.bg, card: t.card, text: t.text, border: t.border, primary: t.primary } }}>
      <AlertWatcher />
      <Stack.Navigator screenOptions={header}>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="TxForm" component={TransactionFormScreen} options={{ title: 'Transaction', presentation: 'modal' }} />
        <Stack.Screen name="Import" component={ImportScreen} options={{ title: 'Import CSV' }} />
        <Stack.Screen name="Categories" component={CategoriesScreen} />
        <Stack.Screen name="Bank" component={BankScreen} options={{ title: 'Bank sync' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
