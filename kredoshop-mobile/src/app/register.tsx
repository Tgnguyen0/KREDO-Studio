import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Field } from '@/components/ui';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { colors, label } from '@/lib/theme';

const GENDERS = [
  { v: 'MALE', t: 'Nam' },
  { v: 'FEMALE', t: 'Nữ' },
  { v: 'OTHER', t: 'Khác' },
];

export default function Register() {
  const toast = useToast();
  const [f, setF] = useState({ fullName: '', phoneNumber: '', email: '', gender: 'MALE', dateOfBirth: '', username: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!f.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên';
    if (!/^(0|84)[35789][0-9]{8}$/.test(f.phoneNumber)) e.phoneNumber = 'Số điện thoại không hợp lệ';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Email không đúng định dạng';
    if (f.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(f.dateOfBirth)) e.dateOfBirth = 'Định dạng YYYY-MM-DD';
    if (f.username.trim().length < 3) e.username = 'Tên đăng nhập tối thiểu 3 ký tự';
    if (f.password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (f.password !== f.confirm) e.confirm = 'Mật khẩu xác nhận không khớp';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      await api.post(
        '/accounts',
        {
          username: f.username.trim(),
          password: f.password,
          customer: { fullName: f.fullName.trim(), phoneNumber: f.phoneNumber, email: f.email.trim(), gender: f.gender, dateOfBirth: f.dateOfBirth || null },
        },
        false,
      );
      toast('Đăng ký thành công! Chào mừng bạn đến với KREDO.', 'success');
      router.replace('/login');
    } catch (e: any) {
      toast(`Đăng ký thất bại: ${e.message}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <Text style={{ fontSize: 40, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -1.5, marginBottom: 24 }}>
          Tạo <Text style={{ color: colors.accent }}>tài khoản.</Text>
        </Text>
        <Field label="Họ và tên" value={f.fullName} onChangeText={set('fullName')} error={errors.fullName} autoCapitalize="words" />
        <Field label="Số điện thoại" value={f.phoneNumber} onChangeText={set('phoneNumber')} error={errors.phoneNumber} keyboardType="phone-pad" />
        <Field label="Email" value={f.email} onChangeText={set('email')} error={errors.email} keyboardType="email-address" />
        <Text style={[label, { color: colors.faint, marginBottom: 8 }]}>Giới tính</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
          {GENDERS.map((g) => (
            <Pressable key={g.v} onPress={() => set('gender')(g.v)} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: f.gender === g.v ? colors.primary : colors.border, backgroundColor: f.gender === g.v ? colors.primary : '#fff' }}>
              <Text style={{ fontWeight: '800', color: f.gender === g.v ? '#fff' : colors.primary }}>{g.t}</Text>
            </Pressable>
          ))}
        </View>
        <Field label="Ngày sinh (YYYY-MM-DD)" value={f.dateOfBirth} onChangeText={set('dateOfBirth')} error={errors.dateOfBirth} placeholder="2000-01-31" keyboardType="numbers-and-punctuation" />
        <Field label="Tên đăng nhập" value={f.username} onChangeText={set('username')} error={errors.username} />
        <Field label="Mật khẩu" value={f.password} onChangeText={set('password')} error={errors.password} secureTextEntry />
        <Field label="Xác nhận mật khẩu" value={f.confirm} onChangeText={set('confirm')} error={errors.confirm} secureTextEntry />
        <Button title="Đăng ký" variant="accent" icon="arrow-forward" loading={busy} onPress={submit} style={{ marginTop: 8 }} />
        <Pressable onPress={() => router.replace('/login')} style={{ marginTop: 20 }}>
          <Text style={{ textAlign: 'center', color: colors.faint, fontSize: 12 }}>
            Đã có tài khoản? <Text style={{ color: colors.primary, fontWeight: '800' }}>Đăng nhập</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
