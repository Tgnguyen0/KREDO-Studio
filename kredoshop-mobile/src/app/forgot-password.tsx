import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import { Button, Field } from '@/components/ui';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { colors, label } from '@/lib/theme';

export default function ForgotPassword() {
  const toast = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [otp, setOtp] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return toast('Email không đúng định dạng', 'info');
    setBusy(true);
    try {
      const data = await api.post('/auth/forgot-password', { email: email.trim() }, false);
      setResetToken(data.result.token);
      toast('Mã OTP đã được gửi đến email của bạn.', 'success');
      setStep(2);
    } catch (e: any) {
      toast(e.message || 'Email không tồn tại hoặc lỗi hệ thống!', 'error');
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!otp || !pw) return toast('Vui lòng nhập OTP và mật khẩu mới', 'info');
    if (pw.length < 6) return toast('Mật khẩu tối thiểu 6 ký tự', 'info');
    setBusy(true);
    try {
      const data = await api.post('/auth/reset-password', { token: resetToken, otp, newPassword: pw }, false);
      if (data?.code !== 0) throw new Error(typeof data?.result === 'string' ? data.result : 'Mã OTP không chính xác hoặc đã hết hạn!');
      toast('Đổi mật khẩu thành công! Hãy đăng nhập lại.', 'success');
      router.replace('/login');
    } catch (e: any) {
      toast(e.message || 'Mã OTP không chính xác hoặc đã hết hạn!', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24 }}>
        <Text style={{ fontSize: 38, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -1.5 }}>
          Quên <Text style={{ color: colors.accent }}>mật khẩu.</Text>
        </Text>
        <Text style={[label, { color: colors.faint, marginTop: 10, marginBottom: 32, letterSpacing: 1.5 }]}>
          {step === 1 ? 'Nhập email để nhận mã OTP' : 'Nhập mã OTP và mật khẩu mới'}
        </Text>
        {step === 1 ? (
          <>
            <Field label="Email" icon="mail-outline" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="email@example.com" />
            <Button title="Gửi mã OTP" icon="arrow-forward" loading={busy} onPress={send} />
          </>
        ) : (
          <>
            <Field label="Mã OTP" icon="key-outline" value={otp} onChangeText={setOtp} keyboardType="number-pad" />
            <Field label="Mật khẩu mới" icon="lock-closed-outline" value={pw} onChangeText={setPw} secureTextEntry />
            <Button title="Đổi mật khẩu" variant="accent" loading={busy} onPress={reset} />
            <Button title="Gửi lại mã" variant="outline" style={{ marginTop: 10 }} onPress={() => setStep(1)} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
