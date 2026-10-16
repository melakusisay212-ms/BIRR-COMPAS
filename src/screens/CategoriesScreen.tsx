import React, { useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, CategoryIcon, Field, Row, Screen, Sub, Title } from '../components/UI';
import { uid, useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import { COLOR_CHOICES, ICON_CHOICES, OTHER_EXPENSE, OTHER_INCOME } from '../lib/defaults';
import type { Category, TxType } from '../lib/types';

export default function CategoriesScreen() {
  const t = useTheme();
  const { state, dispatch } = useStore();
  const [edit, setEdit] = useState<Category | null>(null);

  const addNew = (kind: TxType) => setEdit({ id: uid(), name: '', icon: 'star', color: COLOR_CHOICES[0], kind });
  const isNew = edit ? !state.categories.some((c) => c.id === edit.id) : false;
  const protectedId = (id: string) => id === OTHER_EXPENSE || id === OTHER_INCOME;

  const save = () => {
    if (!edit || !edit.name.trim()) return Alert.alert('Name required');
    dispatch({ type: 'saveCategory', category: { ...edit, name: edit.name.trim(), nameAm: edit.nameAm?.trim() || undefined } });
    setEdit(null);
  };
  const remove = () =>
    Alert.alert(`Delete "${edit?.name}"?`, 'Its transactions move to "Other" and its budget is removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { dispatch({ type: 'deleteCategory', id: edit!.id }); setEdit(null); } },
    ]);

  const section = (kind: TxType, title: string) => (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <Title>{title}</Title>
        <Pressable onPress={() => addNew(kind)} hitSlop={8}><Ionicons name="add-circle" size={28} color={t.primary} /></Pressable>
      </Row>
      {state.categories.filter((c) => c.kind === kind).map((c) => (
        <Pressable key={c.id} onPress={() => setEdit(c)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
          <CategoryIcon category={c} size={34} />
          <Text style={{ color: t.text, marginLeft: 12, flex: 1 }}>{c.name}{c.nameAm ? ` · ${c.nameAm}` : ''}</Text>
          <Ionicons name="create-outline" size={18} color={t.sub} />
        </Pressable>
      ))}
    </Card>
  );

  return (
    <Screen>
      {section('expense', 'Spending categories')}
      {section('income', 'Income categories')}
      <Modal visible={!!edit} animationType="slide" onRequestClose={() => setEdit(null)}>
        <Screen>
          <Title>{isNew ? 'New category' : 'Edit category'}</Title>
          <Field label="Name" value={edit?.name ?? ''} onChangeText={(v) => setEdit((e) => e && { ...e, name: v })} />
          <Field label="Amharic name (optional)" value={edit?.nameAm ?? ''} onChangeText={(v) => setEdit((e) => e && { ...e, nameAm: v })} />
          <Sub style={{ marginBottom: 6 }}>Icon</Sub>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
            {ICON_CHOICES.map((i) => (
              <Pressable key={i} onPress={() => setEdit((e) => e && { ...e, icon: i })} style={{ padding: 8, margin: 3, borderRadius: 10, borderWidth: 2, borderColor: edit?.icon === i ? t.primary : 'transparent' }}>
                <Ionicons name={i as any} size={22} color={edit?.color} />
              </Pressable>
            ))}
          </View>
          <Sub style={{ marginBottom: 6 }}>Color</Sub>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
            {COLOR_CHOICES.map((c) => (
              <Pressable key={c} onPress={() => setEdit((e) => e && { ...e, color: c })} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c, margin: 4, borderWidth: 3, borderColor: edit?.color === c ? t.text : 'transparent' }} />
            ))}
          </View>
          <Button title="Save" onPress={save} />
          {!isNew && edit && !protectedId(edit.id) ? <Button title="Delete" kind="danger" onPress={remove} style={{ marginTop: 10 }} /> : null}
          <Button title="Cancel" kind="ghost" onPress={() => setEdit(null)} style={{ marginTop: 10 }} />
        </Screen>
      </Modal>
    </Screen>
  );
}
