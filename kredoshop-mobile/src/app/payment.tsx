import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { SEPAY_BANK } from '@/lib/config';
import { formatVND } from '@/lib/format';
import { useToast } from '@/lib/toast';
import { colors, label } from '@/lib/theme';

export default function Payment() {
  const { orderId, amount, invoiceId, invoiceCode } = useLocalSearchParams<{ orderId: string; amount: string; invoiceId: string; invoiceCode: string }>();
  const toast = useToast();
  const [paid, setPaid] = useState(false);
  const done = useRef(false);

  const qr = `https://qr.sepay.vn/img?acc=${SEPAY_BANK.acc}&bank=${SEPAY_BANK.bank}&amount=${amount}&des=SEVQR%20${invoiceCode}`;

  useEffect(() => {
    const check = async () => {
      if (done.current) return;
      try {
        const inv = await api.get(`/invoices/${invoiceId}`);
        if (inv?.paymentStatus === 'PAID') {
          done.current = true;
          await api.put(`/orders/status/${orderId}`, { statusOrder: 'CONFIRMED' }).catch(() => {});
          toast('Thanh toán thành công! KREDO cảm ơn quý khách.', 'success');
          setPaid(true);
        }
      } catch {}
    };
    check();
    const t = setInterval(check, 3000);
    return () => clearInterval(t);
  }, [invoiceId, orderId, toast]);

  if (paid)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
        <Ionicons name="checkmark-circle" size={96} color={colors.success} />
        <Text style={{ fontSize: 24, fontWeight: '900', textTransform: 'uppercase' }}>Thanh toán thành công</Text>
        <Text style={{ color: colors.faint, textAlign: 'center' }}>Đơn hàng của bạn đã được xác nhận.</Text>
        <Button title="Xem đơn hàng" style={{ alignSelf: 'stretch', marginTop: 16 }} onPress={() => router.replace('/orders')} />
        <Button title="Về trang chủ" variant="outline" style={{ alignSelf: 'stretch' }} onPress={() => router.replace('/')} />
      </View>
    );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center', paddingBottom: 40 }}>
      <View style={{ backgroundColor: '#fff', padding: 20, borderWidth: 1, borderColor: colors.border, alignSelf: 'stretch', alignItems: 'center' }}>
        <Text style={[label, { color: colors.faint }]}>Mã hóa đơn</Text>
        <Text style={{ fontWeight: '900', fontSize: 16, marginBottom: 4 }}>{invoiceCode}</Text>
        <Text style={{ color: colors.accent, fontWeight: '900', fontSize: 22, marginBottom: 16 }}>{formatVND(Number(amount))}</Text>
        <Image source={{ uri: qr }} style={{ width: 260, height: 260 }} contentFit="contain" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <ActivityIndicator color={colors.accent} />
          <Text style={{ color: colors.faint, fontSize: 12, fontWeight: '700' }}>Đang chờ thanh toán…</Text>
        </View>
      </View>
      <View style={{ backgroundColor: '#fff', padding: 16, borderWidth: 1, borderColor: colors.border, alignSelf: 'stretch', marginTop: 14 }}>
        {[['Ngân hàng', SEPAY_BANK.bank], ['Số tài khoản', SEPAY_BANK.acc], ['Nội dung CK', `SEVQR ${invoiceCode}`]].map(([k, v]) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
            <Text style={{ color: colors.faint, fontSize: 12 }}>{k}</Text>
            <Text selectable style={{ fontWeight: '900', fontSize: 12 }}>{v}</Text>
          </View>
        ))}
        <Text style={{ color: colors.faint, fontSize: 11, marginTop: 8 }}>Quét mã QR bằng app ngân hàng, giữ nguyên nội dung chuyển khoản để hệ thống tự đối soát.</Text>
      </View>
      <Pressable onPress={() => Linking.openURL(qr)} style={{ marginTop: 12 }}>
        <Text style={[label, { color: colors.accent }]}>Mở ảnh QR</Text>
      </Pressable>
      <Button title="Thanh toán sau · Xem đơn hàng" variant="outline" style={{ alignSelf: 'stretch', marginTop: 20 }} onPress={() => router.replace('/orders')} />
    </ScrollView>
  );
}
