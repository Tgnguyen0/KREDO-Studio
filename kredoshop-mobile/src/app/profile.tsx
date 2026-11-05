import React, { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AddressForm from '@/components/AddressForm';
import { Button, Field, Loading } from '@/components/ui';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { toDateInput } from '@/lib/format';
import { colors, label } from '@/lib/theme';
import type { Address } from '@/lib/types';

const GENDERS = [
  { v: 'MALE', t: 'Nam' },
  { v: 'FEMALE', t: 'Nữ' },
  { v: 'OTHER', t: 'Khác' },
];

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ id: null as number | null, fullName: '', phoneNumber: '', email: '', gender: 'MALE', dateOfBirth: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [mode, setMode] = useState<null | 'new' | number>(null);

  const loadAddresses = useCallback(async () => {
    if (!user) return;
    try {
      const d = await api.get(`/addresses/${user.id}`);
      setAddresses(Array.isArray(d) ? d : unwrap(d) || []);
    } catch {
      toast('Không thể tải địa chỉ', 'error');
    }
  }, [user, toast]);

  useEffect(() => {
    (async () => {
      try {
        const c = unwrap<any>(await api.get('/customers/profile'));
        setF({ id: c.id, fullName: c.fullName || '', phoneNumber: c.phoneNumber || '', email: c.email || '', gender: c.gender || 'MALE', dateOfBirth: toDateInput(c.dateOfBirth) });
      } catch (e: any) {
        toast(e.message, 'error');
      } finally {
        setLoading(false);
      }
      loadAddresses();
    })();
  }, [loadAddresses, toast]);

  const save = async () => {
    const e: Record<string, string> = {};
    if (!f.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên';
    if (!/^(0|84)[35789][0-9]{8}$/.test(f.phoneNumber)) e.phoneNumber = 'Số điện thoại không hợp lệ';
    if (f.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(f.dateOfBirth)) e.dateOfBirth = 'Định dạng YYYY-MM-DD';
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await api.put('/customers/update-profile', { ...f, dateOfBirth: f.dateOfBirth || null });
      toast('Cập nhật thông tin thành công!', 'success');
    } catch (err: any) {
      toast(err.message || 'Cập nhật thất bại.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeAddr = (a: Address) =>
    Alert.alert('Xóa địa chỉ?', a.delivery_address, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/addresses/${a.id}`);
            toast('Đã xóa địa chỉ', 'success');
            loadAddresses();
          } catch (err: any) {
            toast(err.message, 'error');
          }
        },
      },
    ]);

  if (loading) return <Loading />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <View style={{ backgroundColor: '#fff', padding: 16, borderWidth: 1, borderColor: colors.border }}>
          <Text style={[label, { color: colors.primary, fontSize: 12, marginBottom: 14 }]}>Thông tin cá nhân</Text>
          <Field label="Họ và tên" value={f.fullName} onChangeText={(v) => setF((p) => ({ ...p, fullName: v }))} error={errors.fullName} autoCapitalize="words" />
          <Field label="Email" value={f.email} editable={false} style={{ color: colors.faint }} />
          <Field label="Số điện thoại" value={f.phoneNumber} onChangeText={(v) => setF((p) => ({ ...p, phoneNumber: v }))} error={errors.phoneNumber} keyboardType="phone-pad" />
          <Text style={[label, { color: colors.faint, marginBottom: 8 }]}>Giới tính</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
            {GENDERS.map((g) => (
              <Pressable key={g.v} onPress={() => setF((p) => ({ ...p, gender: g.v }))} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: f.gender === g.v ? colors.primary : colors.border, backgroundColor: f.gender === g.v ? colors.primary : '#fff' }}>
                <Text style={{ fontWeight: '800', color: f.gender === g.v ? '#fff' : colors.primary }}>{g.t}</Text>
              </Pressable>
            ))}
          </View>
          <Field label="Ngày sinh (YYYY-MM-DD)" value={f.dateOfBirth} onChangeText={(v) => setF((p) => ({ ...p, dateOfBirth: v }))} error={errors.dateOfBirth} keyboardType="numbers-and-punctuation" />
          <Button title="Lưu thay đổi" variant="accent" loading={saving} onPress={save} />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 12 }}>
          <Text style={[label, { color: colors.primary, fontSize: 12 }]}>Sổ địa chỉ</Text>
          {mode === null && (
            <Pressable onPress={() => setMode('new')}>
              <Text style={[label, { color: colors.accent }]}>+ Thêm mới</Text>
            </Pressable>
          )}
        </View>

        {mode === 'new' && (
          <AddressForm
            onCancel={() => setMode(null)}
            onSubmit={async (v) => {
              try {
                await api.post('/addresses/add', { accountId: user!.id, ...v });
                toast('Thêm địa chỉ thành công!', 'success');
                setMode(null);
                loadAddresses();
              } catch (err: any) {
                toast(err.message, 'error');
              }
            }}
          />
        )}

        {addresses.length === 0 && mode === null && <Text style={{ color: colors.faint, fontSize: 13 }}>Bạn chưa lưu địa chỉ nào.</Text>}
        {addresses.map((a) =>
          mode === a.id ? (
            <View key={a.id} style={{ marginBottom: 12 }}>
              <AddressForm
                initial={{ province: a.province, delivery_address: a.delivery_address, delivery_note: a.delivery_note }}
                submitLabel="Cập nhật"
                onCancel={() => setMode(null)}
                onSubmit={async (v) => {
                  try {
                    await api.put('/addresses/update', { id: a.id, accountId: user!.id, ...v });
                    toast('Cập nhật địa chỉ thành công!', 'success');
                    setMode(null);
                    loadAddresses();
                  } catch (err: any) {
                    toast(err.message, 'error');
                  }
                }}
              />
            </View>
          ) : (
            <View key={a.id} style={{ backgroundColor: '#fff', padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="location-outline" size={20} color={colors.accent} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ fontWeight: '800', fontSize: 13 }}>{a.delivery_address}</Text>
                <Text style={{ color: colors.faint, fontSize: 12 }}>{a.province}</Text>
                {!!a.delivery_note && <Text style={{ color: colors.faint, fontSize: 11, fontStyle: 'italic' }}>{a.delivery_note}</Text>}
              </View>
              <Pressable onPress={() => setMode(a.id)} hitSlop={8} style={{ padding: 8 }}>
                <Ionicons name="create-outline" size={20} />
              </Pressable>
              <Pressable onPress={() => removeAddr(a)} hitSlop={8} style={{ padding: 8 }}>
                <Ionicons name="trash-outline" size={20} color={colors.accent} />
              </Pressable>
            </View>
          ),
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
