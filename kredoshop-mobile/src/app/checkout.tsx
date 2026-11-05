import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddressForm from '@/components/AddressForm';
import { Button, Field, Loading } from '@/components/ui';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { getCheckout, setCheckout } from '@/lib/checkoutStore';
import { FREE_SHIP_MIN, SHIP_FEE } from '@/lib/config';
import { formatVND } from '@/lib/format';
import { colors, label } from '@/lib/theme';
import type { Address } from '@/lib/types';

const card = { backgroundColor: '#fff', padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14 };
const h = [label, { color: colors.primary, fontSize: 12, marginBottom: 14 }] as const;

export default function Checkout() {
  const insets = useSafeAreaInsets();
  const { user, cartId, refreshCart } = useAuth();
  const toast = useToast();
  const payload = useMemo(() => getCheckout(), []);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selAddr, setSelAddr] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [info, setInfo] = useState({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [payment, setPayment] = useState<'cash' | 'bank'>('cash');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const lines = useMemo(() => {
    if (!payload) return [];
    if (payload.kind === 'buynow')
      return [{ key: 'p', name: payload.product.name, image: payload.product.imageUrlFront, qty: payload.quantity, total: (payload.product.costPrice || payload.product.price) * payload.quantity, sub: payload.size ? `Size ${payload.size}` : '' }];
    return payload.items.map((i) => ({ key: String(i.id), name: i.productName, image: i.productImage, qty: i.quantity, total: i.subtotal, sub: '' }));
  }, [payload]);
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const ship = subtotal >= FREE_SHIP_MIN ? 0 : SHIP_FEE;
  const total = subtotal + ship;

  const loadAddresses = async () => {
    if (!user) return;
    const list: Address[] = (await api.get(`/addresses/${user.id}`)) || [];
    const arr = Array.isArray(list) ? list : unwrap(list) || [];
    setAddresses(arr);
    return arr;
  };

  useEffect(() => {
    if (!payload || !user) {
      router.back();
      return;
    }
    (async () => {
      try {
        const [arr, c] = await Promise.all([loadAddresses(), api.get(`/customers/${user.id}`).catch(() => null)]);
        if (arr?.length) setSelAddr(arr[0].id);
        else setAdding(true);
        const cu = unwrap<any>(c) || {};
        setInfo({ name: cu.fullName || '', phone: cu.phoneNumber || '', email: cu.email || '' });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirm = async () => {
    if (!payload || !user) return;
    const e: Record<string, string> = {};
    if (!info.name.trim()) e.name = 'Họ và tên không được để trống';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) e.email = 'Email không đúng định dạng';
    if (!/^(0|84)[35789][0-9]{8}$/.test(info.phone)) e.phone = 'Số điện thoại không hợp lệ';
    const addr = addresses.find((a) => a.id === selAddr);
    if (adding) return toast('Vui lòng lưu địa chỉ mới trước khi đặt hàng', 'info');
    if (!addr) e.address = 'Vui lòng chọn địa chỉ giao hàng';
    setErrors(e);
    if (Object.keys(e).length) return toast(Object.values(e)[0], 'info');

    setBusy(true);
    try {
      const fullAddress = `${addr!.delivery_address}, ${addr!.province}`;
      const trading = await api.post('/customer-trading/create', {
        receiverName: info.name,
        receiverPhone: info.phone,
        receiverEmail: info.email,
        receiverAddress: fullAddress,
        totalAmount: total,
      });
      const order = await api.post('/orders/create', {
        customerTradingId: trading.id,
        note,
        account_id: user.id,
        paymentMethod: payment === 'bank' ? 'BANK_TRANSFER' : 'CASH',
      });

      if (payload.kind === 'buynow') {
        const price = payload.product.costPrice || payload.product.price;
        await api.post('/order-details/create', {
          productName: payload.product.name,
          quantity: payload.quantity,
          unitPrice: price,
          totalPrice: price * payload.quantity,
          orderId: order.id,
          productId: payload.product.id,
        });
      } else {
        for (const it of payload.items) {
          await api.post('/order-details/create', {
            productName: it.productName,
            quantity: it.quantity,
            unitPrice: it.priceAtTime,
            totalPrice: it.subtotal,
            orderId: order.id,
            productId: it.productId || it.id,
          });
          await api.del(`/cart-details/delete/${it.id}`);
          if (cartId) await api.put(`/carts/update/${cartId}/delete`, { price: it.subtotal, quantity: it.quantity });
        }
        await refreshCart();
      }
      setCheckout(null);
      toast('Đặt hàng thành công!', 'success');

      if (payment === 'bank') {
        const inv = await api.post('/invoices', { orderId: order.id, paymentMethod: 'BANK_TRANSFER', paymentStatus: 'UNPAID' });
        router.replace({
          pathname: '/payment',
          params: { orderId: String(order.id), amount: String(total), invoiceId: String(inv.id), invoiceCode: String(inv.invoiceCode) },
        });
      } else {
        router.replace('/orders');
      }
    } catch (err: any) {
      toast(err.message || 'Đặt hàng thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        <View style={card}>
          <Text style={h}>1 · Thông tin người nhận</Text>
          <Field label="Họ và tên" value={info.name} onChangeText={(v) => setInfo((p) => ({ ...p, name: v }))} error={errors.name} autoCapitalize="words" />
          <Field label="Số điện thoại" value={info.phone} onChangeText={(v) => setInfo((p) => ({ ...p, phone: v }))} error={errors.phone} keyboardType="phone-pad" />
          <Field label="Email" value={info.email} onChangeText={(v) => setInfo((p) => ({ ...p, email: v }))} error={errors.email} keyboardType="email-address" />
        </View>

        <View style={card}>
          <Text style={h}>2 · Địa chỉ giao hàng</Text>
          {!adding &&
            addresses.map((a) => (
              <Pressable key={a.id} onPress={() => setSelAddr(a.id)} style={{ flexDirection: 'row', gap: 12, padding: 12, borderWidth: 1, marginBottom: 10, borderColor: selAddr === a.id ? colors.primary : colors.border }}>
                <Ionicons name={selAddr === a.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={selAddr === a.id ? colors.accent : colors.faint} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', fontSize: 13 }}>{a.delivery_address}</Text>
                  <Text style={{ color: colors.faint, fontSize: 12 }}>{a.province}</Text>
                  {!!a.delivery_note && <Text style={{ color: colors.faint, fontSize: 11, fontStyle: 'italic' }}>{a.delivery_note}</Text>}
                </View>
              </Pressable>
            ))}
          {errors.address && !adding && <Text style={{ color: colors.accent, fontSize: 11, marginBottom: 8 }}>{errors.address}</Text>}
          {adding ? (
            <AddressForm
              submitLabel="Lưu địa chỉ"
              onCancel={addresses.length ? () => setAdding(false) : undefined}
              onSubmit={async (v) => {
                try {
                  await api.post('/addresses/add', { accountId: user!.id, ...v });
                  const arr = await loadAddresses();
                  if (arr?.length) setSelAddr(arr[arr.length - 1].id);
                  setAdding(false);
                  toast('Thêm địa chỉ thành công!', 'success');
                } catch (err: any) {
                  toast(err.message, 'error');
                }
              }}
            />
          ) : (
            <Button title="+ Thêm địa chỉ mới" variant="outline" onPress={() => setAdding(true)} />
          )}
          <View style={{ height: 14 }} />
          <Field label="Ghi chú đơn hàng" value={note} onChangeText={setNote} autoCapitalize="sentences" />
        </View>

        <View style={card}>
          <Text style={h}>3 · Phương thức thanh toán</Text>
          {([['cash', 'Thanh toán khi nhận hàng (COD)', 'cash-outline'], ['bank', 'Chuyển khoản QR ngân hàng', 'qr-code-outline']] as const).map(([k, t, ic]) => (
            <Pressable key={k} onPress={() => setPayment(k)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1, marginBottom: 10, borderColor: payment === k ? colors.primary : colors.border }}>
              <Ionicons name={ic} size={22} />
              <Text style={{ flex: 1, fontWeight: '800', fontSize: 13 }}>{t}</Text>
              <Ionicons name={payment === k ? 'radio-button-on' : 'radio-button-off'} size={20} color={payment === k ? colors.accent : colors.faint} />
            </Pressable>
          ))}
        </View>

        <View style={card}>
          <Text style={h}>Đơn hàng ({lines.length})</Text>
          {lines.map((l) => (
            <View key={l.key} style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <Image source={{ uri: l.image }} style={{ width: 52, height: 68, backgroundColor: '#EEEDE9' }} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={{ fontWeight: '800', fontSize: 12, textTransform: 'uppercase' }}>{l.name}</Text>
                <Text style={{ color: colors.faint, fontSize: 11, marginTop: 2 }}>SL: {l.qty} {l.sub ? `· ${l.sub}` : ''}</Text>
              </View>
              <Text style={{ fontWeight: '900', fontSize: 12 }}>{formatVND(l.total)}</Text>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
          <Row t="Tạm tính" v={formatVND(subtotal)} />
          <Row t="Phí vận chuyển" v={ship === 0 ? 'Miễn phí' : formatVND(ship)} />
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', padding: 14, paddingBottom: insets.bottom + 14, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ flex: 1 }}>
          <Text style={[label, { color: colors.faint }]}>Tổng cộng</Text>
          <Text style={{ fontSize: 18, fontWeight: '900', color: colors.accent }}>{formatVND(total)}</Text>
        </View>
        <Button title="Đặt hàng" variant="accent" loading={busy} onPress={confirm} style={{ paddingHorizontal: 28 }} />
      </View>
    </KeyboardAvoidingView>
  );
}

const Row = ({ t, v }: { t: string; v: string }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 }}>
    <Text style={{ color: colors.faint, fontSize: 12, fontWeight: '700' }}>{t}</Text>
    <Text style={{ fontWeight: '800', fontSize: 12 }}>{v}</Text>
  </View>
);
