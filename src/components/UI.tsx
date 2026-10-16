import React from 'react';
import { View, Text, Pressable, TextInput, TextInputProps, StyleProp, ViewStyle, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';
import type { Category } from '../lib/types';
import type { Insight } from '../lib/analytics';

export function Screen({ children, scroll = true, pad = true }: { children: React.ReactNode; scroll?: boolean; pad?: boolean }) {
  const t = useTheme();
  if (!scroll) return <View style={{ flex: 1, backgroundColor: t.bg, padding: pad ? 16 : 0 }}>{children}</View>;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: pad ? 16 : 0, paddingBottom: 96 }} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[{ backgroundColor: t.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border }, style]}>{children}</View>;
}

export function Title({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <Text style={{ color: t.text, fontSize: 17, fontWeight: '700', marginBottom: 10 }}>{children}</Text>;
}

export function Sub({ children, style }: { children: React.ReactNode; style?: any }) {
  const t = useTheme();
  return <Text style={[{ color: t.sub, fontSize: 13 }, style]}>{children}</Text>;
}

export function Button({ title, onPress, kind = 'primary', disabled, style }: { title: string; onPress: () => void; kind?: 'primary' | 'ghost' | 'danger'; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const bg = kind === 'primary' ? t.primary : 'transparent';
  const color = kind === 'primary' ? t.onPrimary : kind === 'danger' ? t.danger : t.primary;
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" style={[{ backgroundColor: bg, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', opacity: disabled ? 0.4 : 1, borderWidth: kind === 'primary' ? 0 : 1, borderColor: color }, style]}>
      <Text style={{ color, fontWeight: '700', fontSize: 15 }}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress, color }: { label: string; active?: boolean; onPress?: () => void; color?: string }) {
  const t = useTheme();
  const c = color ?? t.primary;
  return (
    <Pressable onPress={onPress} style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 18, marginRight: 8, marginBottom: 8, backgroundColor: active ? c : 'transparent', borderWidth: 1, borderColor: active ? c : t.border }}>
      <Text style={{ color: active ? '#fff' : t.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, style, ...props }: TextInputProps & { label?: string }) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Sub style={{ marginBottom: 4 }}>{label}</Sub> : null}
      <TextInput placeholderTextColor={t.sub} {...props} style={[{ backgroundColor: t.input, color: t.text, borderRadius: 10, borderWidth: 1, borderColor: t.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 }, style]} />
    </View>
  );
}

// Progress with a tick at 80% so the alert threshold is always visible.
export function ProgressBar({ ratio, marker = true, color }: { ratio: number; marker?: boolean; color?: string }) {
  const t = useTheme();
  const pct = Math.min(1, Math.max(0, ratio));
  const fill = color ?? (ratio >= 1 ? t.danger : ratio >= 0.8 ? t.warn : t.primary);
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }} style={{ height: 10, borderRadius: 5, backgroundColor: t.border }}>
      <View style={{ width: `${pct * 100}%`, height: 10, borderRadius: 5, backgroundColor: fill }} />
      {marker ? <View style={{ position: 'absolute', left: '80%', top: -2, width: 2, height: 14, backgroundColor: t.sub, opacity: 0.45 }} /> : null}
    </View>
  );
}

export function CategoryIcon({ category, size = 40 }: { category?: Category; size?: number }) {
  const color = category?.color ?? '#8A8A8A';
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color + '26', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={(category?.icon ?? 'ellipsis-horizontal') as any} size={size * 0.5} color={color} />
    </View>
  );
}

export function InsightCard({ insight }: { insight: Insight }) {
  const t = useTheme();
  const color = insight.tone === 'warn' ? t.warn : insight.tone === 'good' ? t.good : t.sub;
  const icon = insight.tone === 'warn' ? 'alert-circle' : insight.tone === 'good' ? 'checkmark-circle' : 'bulb';
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.card, borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: color }}>
      <Ionicons name={icon as any} size={22} color={color} style={{ marginRight: 10, marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontWeight: '700', marginBottom: 2 }}>{insight.title}</Text>
        <Text style={{ color: t.sub, lineHeight: 19 }}>{insight.body}</Text>
      </View>
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  const t = useTheme();
  return <Text style={{ color: t.sub, textAlign: 'center', marginVertical: 24 }}>{text}</Text>;
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>;
}
