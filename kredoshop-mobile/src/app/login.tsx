import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Field } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { colors, label } from '@/lib/theme';

export default function Login() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password) return toast('Vui lòng nhập đầy đủ thông tin', 'info');
    setBusy(true);
    try {
      await login(username.trim(), password);
      toast('Chào mừng bạn trở lại!', 'success');
      router.canGoBack() ? router.back() : router.replace('/');
    } catch (e: any) {
      toast(e.message || 'Tên đăng nhập hoặc mật khẩu không đúng.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#FDFCFB' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingTop: insets.top + 12, paddingBottom: 40 }}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={{ alignSelf: 'flex-start', padding: 4, marginBottom: 12 }}>
          <Ionicons name="close" size={26} />
        </Pressable>
        <Image source={require('../../assets/brand/logo.png')} style={{ width: 56, height: 56, marginBottom: 20 }} contentFit="contain" />
        <Text style={[label, { backgroundColor: colors.secondary, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, marginBottom: 20 }]}>KREDO Studio / Auth</Text>
        <Text style={{ fontSize: 52, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -2, lineHeight: 52 }}>Đăng</Text>
        <Text style={{ fontSize: 52, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -2, lineHeight: 56, color: colors.accent }}>Nhập.</Text>
        <Text style={[label, { color: colors.faint, marginTop: 10, marginBottom: 36, letterSpacing: 1.5 }]}>Truy cập vào không gian thời trang của bạn</Text>

        <Field label="Tên đăng nhập" icon="person-outline" value={username} onChangeText={setUsername} placeholder="Nhập tài khoản của bạn..." />
        <Field
          label="Mật khẩu"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!show}
          placeholder="••••••••"
          onSubmitEditing={submit}
          right={
            <Pressable onPress={() => setShow((s) => !s)} hitSlop={8}>
              <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.faint} />
            </Pressable>
          }
        />
        <Pressable onPress={() => router.push('/forgot-password')} style={{ alignSelf: 'flex-end', marginTop: -6, marginBottom: 24 }}>
          <Text style={[label, { color: colors.faint, fontSize: 9 }]}>Quên mật khẩu?</Text>
        </Pressable>

        <Button title="Đăng nhập ngay" icon="arrow-forward" loading={busy} onPress={submit} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text style={[label, { color: colors.faint }]}>Hoặc</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>
        <Button title="Tạo tài khoản mới" variant="outline" onPress={() => router.push('/register')} />
        <Pressable onPress={() => router.push('/policy')} style={{ marginTop: 28 }}>
          <Text style={{ textAlign: 'center', fontSize: 10, color: colors.faint, lineHeight: 16 }}>
            Bằng cách đăng nhập, bạn đồng ý với{'\n'}
            <Text style={{ color: colors.primary, textDecorationLine: 'underline' }}>Điều khoản & Chính sách</Text> của KREDO
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
