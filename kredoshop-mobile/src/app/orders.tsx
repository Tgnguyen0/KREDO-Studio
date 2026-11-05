import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Button, Empty, Loading } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { formatDate, formatVND } from '@/lib/format';
import { colors, label } from '@/lib/theme';
import type { Order } from '@/lib/types';

const STATUS: Record<string, { t: string; fg: string; bg: string; step: number }> = {
  PENDING: { t: 'Chờ xác nhận', fg: '#B91C1C', bg: '#FEF2F2', step: 1 },
  CONFIRMED: { t: 'Đã xác nhận', fg: '#1D4ED8', bg: '#EFF6FF', step: 2 },
  SHIPPING: { t: 'Đang giao hàng', fg: '#1D4ED8', bg: '#EFF6FF', step: 3 },
  COMPLETED: { t: 'Hoàn thành', fg: '#047857', bg: '#ECFDF5', step: 4 },
  CANCELLED: { t: 'Đã hủy', fg: 'rgba(17,17,17,0.45)', bg: '#F3F4F6', step: 0 },
};
const STEPS = ['Chờ duyệt', 'Xác nhận', 'Đang giao', 'Hoàn tất'];
const PAY: Record<string, string> = { COD: 'COD', CASH: 'Tiền mặt', BANKING: 'Chuyển khoản', BANK_TRANSFER: 'Chuyển khoản', MOMO: 'MoMo', VNPAY: 'VNPAY' };
const TABS = [
  { k: 'all', t: 'Tất cả' },
  { k: 'PENDING', t: 'Chờ xác nhận' },
  { k: 'CONFIRMED', t: 'Đã xác nhận' },
  { k: 'SHIPPING', t: 'Đang giao' },
  { k: 'COMPLETED', t: 'Hoàn thành' },
  { k: 'CANCELLED', t: 'Đã hủy' },
] as const;

export default function Orders() {
  const { user } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>('all');
  const [open, setOpen] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!user) return setLoading(false);
    try {
      const data = await api.get(`/orders/account/${user.id}`);
      const list: Order[] = Array.isArray(data) ? data : data?.result || [];
      setOrders([...list].sort((a, b) => +new Date(b.orderDate) - +new Date(a.orderDate)));
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const shown = useMemo(() => (tab === 'all' ? orders : orders.filter((o) => o.statusOrder === tab)), [orders, tab]);
  const count = (k: string) => (k === 'all' ? orders.length : orders.filter((o) => o.statusOrder === k).length);

  const cancel = (o: Order) =>
    Alert.alert('Hủy đơn hàng này?', 'Hành động này không thể hoàn tác.', [
      { text: 'Giữ đơn', style: 'cancel' },
      {
        text: 'Hủy đơn',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.put(`/orders/status/${o.id}`, { statusOrder: 'CANCELLED' });
            await load();
            toast('Đơn hàng đã được hủy thành công.', 'success');
          } catch {
            toast('Lỗi khi hủy đơn hàng!', 'error');
          }
        },
      },
    ]);

  if (loading) return <Loading />;
  if (!user) return <Empty icon="receipt-outline" title="Vui lòng đăng nhập" action={<Button title="Đăng nhập" onPress={() => router.push('/login')} />} />;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 48 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 18, alignItems: 'center' }}>
          {TABS.map((t) => (
            <Pressable key={t.k} onPress={() => setTab(t.k)}>
              <Text style={[label, { color: tab === t.k ? colors.accent : colors.faint, paddingBottom: 4, borderBottomWidth: 2, borderBottomColor: tab === t.k ? colors.accent : 'transparent' }]}>
                {t.t} ({count(t.k)})
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={shown}
        keyExtractor={(o) => String(o.id)}
        onRefresh={load}
        refreshing={false}
        contentContainerStyle={{ padding: 16, gap: 14 }}
        ListEmptyComponent={<Empty icon="receipt-outline" title="Chưa có đơn hàng" action={<Button title="Mua sắm ngay" onPress={() => router.push('/products')} />} />}
        renderItem={({ item: o }) => {
          const st = STATUS[o.statusOrder] || STATUS.PENDING;
          const details = o.orderDetails || [];
          const total = o.customerTrading?.totalAmount ?? details.reduce((s, d) => s + d.unitPrice * d.quantity, 0);
          const expanded = open === o.id;
          return (
            <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border }}>
              <Pressable onPress={() => setOpen(expanded ? null : o.id)} style={{ padding: 14, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '900', fontSize: 13 }}>#{o.orderCode || o.id}</Text>
                  <Text style={{ color: colors.faint, fontSize: 11, marginTop: 2 }}>{formatDate(o.orderDate)}</Text>
                </View>
                <View style={{ backgroundColor: st.bg, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ color: st.fg, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>{st.t}</Text>
                </View>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.faint} style={{ marginLeft: 8 }} />
              </Pressable>

              {st.step > 0 && (
                <View style={{ flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 12, gap: 4 }}>
                  {STEPS.map((s, i) => (
                    <View key={s} style={{ flex: 1 }}>
                      <View style={{ height: 3, backgroundColor: i < st.step ? colors.accent : colors.border }} />
                      <Text style={{ fontSize: 8, marginTop: 4, fontWeight: '800', textTransform: 'uppercase', color: i < st.step ? colors.primary : colors.faint }}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              {(expanded ? details : details.slice(0, 1)).map((d) => (
                <Pressable key={d.id} onPress={() => router.push({ pathname: '/product/[id]', params: { id: String(d.productId) } })} style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
                  {d.productImage ? (
                    <Image source={{ uri: d.productImage }} style={{ width: 48, height: 62, backgroundColor: '#EEEDE9' }} contentFit="cover" />
                  ) : (
                    <View style={{ width: 48, height: 62, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontWeight: '900' }}>{d.productName?.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={2} style={{ fontWeight: '800', fontSize: 12, textTransform: 'uppercase' }}>{d.productName}</Text>
                    <Text style={{ color: colors.faint, fontSize: 11, marginTop: 2 }}>x{d.quantity}</Text>
                  </View>
                  <Text style={{ fontWeight: '900', fontSize: 12 }}>{formatVND(d.unitPrice)}</Text>
                </Pressable>
              ))}
              {!expanded && details.length > 1 && (
                <Text style={{ paddingHorizontal: 14, paddingBottom: 8, color: colors.faint, fontSize: 11 }}>+ {details.length - 1} sản phẩm khác</Text>
              )}

              {expanded && o.customerTrading && (
                <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: colors.border, gap: 3 }}>
                  <Text style={[label, { color: colors.faint }]}>Giao đến</Text>
                  <Text style={{ fontWeight: '800', fontSize: 12 }}>{o.customerTrading.receiverName} · {o.customerTrading.receiverPhone}</Text>
                  <Text style={{ color: colors.faint, fontSize: 12 }}>{o.customerTrading.receiverAddress}</Text>
                  {!!o.paymentMethod && <Text style={{ color: colors.faint, fontSize: 12, marginTop: 4 }}>Thanh toán: {PAY[o.paymentMethod] || o.paymentMethod}</Text>}
                </View>
              )}

              <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={[label, { color: colors.faint }]}>Tổng tiền</Text>
                  <Text style={{ fontWeight: '900', fontSize: 16, color: colors.accent }}>{formatVND(total)}</Text>
                </View>
                {o.statusOrder === 'PENDING' && <Button title="Hủy đơn" variant="outline" onPress={() => cancel(o)} style={{ minHeight: 40, paddingVertical: 10 }} />}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
