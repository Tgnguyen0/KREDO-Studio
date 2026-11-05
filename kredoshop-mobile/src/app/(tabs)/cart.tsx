import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Empty, Loading } from '@/components/ui';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { setCheckout } from '@/lib/checkoutStore';
import { FREE_SHIP_MIN } from '@/lib/config';
import { formatVND } from '@/lib/format';
import { colors, label } from '@/lib/theme';
import type { CartItem } from '@/lib/types';

export default function Cart() {
  const insets = useSafeAreaInsets();
  const { user, cartId, refreshCart } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!cartId) return setLoading(false);
    try {
      const raw = await api.get(`/cart-details/cart/${cartId}`);
      const list: any[] = Array.isArray(raw) ? raw : raw?.result || raw?.cartDetails || [];
      setItems(list.map((i) => ({ ...i, selected: i.selected ?? i.isSelected ?? false })));
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [cartId, toast]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const selected = useMemo(() => items.filter((i) => i.selected), [items]);
  const subtotal = selected.reduce((s, i) => s + i.subtotal, 0);
  const pct = Math.min(100, Math.round((subtotal / FREE_SHIP_MIN) * 100));

  const toggle = async (it: CartItem) => {
    const next = !it.selected;
    setItems((p) => p.map((i) => (i.id === it.id ? { ...i, selected: next } : i)));
    try {
      await api.put(`/cart-details/${it.id}/select`, { selected: next });
    } catch {}
  };

  const change = async (it: CartItem, dir: 'increase' | 'decrease') => {
    try {
      const data = await api.put(`/cart-details/${it.id}/${dir}-quantity`);
      if (!data || data.quantity === 0) setItems((p) => p.filter((i) => i.id !== it.id));
      else setItems((p) => p.map((i) => (i.id === it.id ? { ...i, ...data } : i)));
      await api.put(`/carts/update/${cartId}/${dir}`, { price: it.priceAtTime });
      refreshCart();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const remove = (it: CartItem) =>
    Alert.alert('Xóa sản phẩm?', it.productName, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/cart-details/delete/${it.id}`);
            setItems((p) => p.filter((i) => i.id !== it.id));
            await api.put(`/carts/update/${cartId}/delete`, { price: it.subtotal, quantity: it.quantity });
            refreshCart();
          } catch (e: any) {
            toast(e.message, 'error');
          }
        },
      },
    ]);

  const checkout = () => {
    if (!items.length) return toast('Giỏ hàng rỗng!', 'info');
    if (!selected.length) return toast('Vui lòng chọn sản phẩm muốn thanh toán', 'info');
    setCheckout({ kind: 'cart', items: selected });
    router.push('/checkout');
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Text style={{ fontSize: 26, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        Giỏ hàng
      </Text>
      {!user ? (
        <Empty icon="bag-outline" title="Đăng nhập để xem giỏ hàng" action={<Button title="Đăng nhập" onPress={() => router.push('/login')} />} />
      ) : loading ? (
        <Loading />
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => String(i.id)}
            onRefresh={load}
            refreshing={false}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            ListHeaderComponent={
              subtotal > 0 ? (
                <View style={{ backgroundColor: '#fff', padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: subtotal >= FREE_SHIP_MIN ? colors.success : colors.primary }}>
                    {subtotal >= FREE_SHIP_MIN
                      ? 'Đơn hàng đã được miễn phí vận chuyển!'
                      : `Mua thêm ${formatVND(FREE_SHIP_MIN - subtotal)} để được miễn phí vận chuyển`}
                  </Text>
                  <View style={{ height: 6, backgroundColor: colors.secondary, marginTop: 10, overflow: 'hidden', borderRadius: 3 }}>
                    <View style={{ width: `${pct}%`, height: '100%', backgroundColor: subtotal >= FREE_SHIP_MIN ? colors.success : colors.accent }} />
                  </View>
                </View>
              ) : undefined
            }
            ListEmptyComponent={
              <Empty icon="bag-outline" title="Giỏ hàng trống" sub="Hãy chọn vài món đồ bạn yêu thích." action={<Button title="Mua sắm ngay" onPress={() => router.push('/products')} />} />
            }
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row', gap: 12, backgroundColor: '#fff', padding: 12, borderWidth: 1, borderColor: colors.border }}>
                <Pressable onPress={() => toggle(item)} hitSlop={8} style={{ justifyContent: 'center' }}>
                  <Ionicons name={item.selected ? 'checkbox' : 'square-outline'} size={24} color={item.selected ? colors.accent : colors.faint} />
                </Pressable>
                <Pressable onPress={() => router.push({ pathname: '/product/[id]', params: { id: String(item.productId) } })}>
                  <Image source={{ uri: item.productImage }} style={{ width: 76, height: 100, backgroundColor: '#EEEDE9' }} contentFit="cover" />
                </Pressable>
                <View style={{ flex: 1, justifyContent: 'space-between' }}>
                  <View>
                    <Text numberOfLines={2} style={{ fontWeight: '800', fontSize: 12, textTransform: 'uppercase' }}>
                      {item.productName}
                    </Text>
                    {!!(item.sizeName || item.size) && <Text style={[label, { color: colors.faint, marginTop: 4 }]}>Size {item.sizeName || item.size}</Text>}
                    <Text style={{ color: colors.accent, fontWeight: '900', marginTop: 4 }}>{formatVND(item.priceAtTime)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
                      <Pressable onPress={() => change(item, 'decrease')} style={{ padding: 8 }}>
                        <Ionicons name="remove" size={16} />
                      </Pressable>
                      <Text style={{ minWidth: 26, textAlign: 'center', fontWeight: '900' }}>{item.quantity}</Text>
                      <Pressable onPress={() => change(item, 'increase')} style={{ padding: 8 }}>
                        <Ionicons name="add" size={16} />
                      </Pressable>
                    </View>
                    <Pressable onPress={() => remove(item)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={20} color={colors.accent} />
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          />
          {items.length > 0 && (
            <View style={{ backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={[label, { color: colors.faint }]}>Tạm tính ({selected.length})</Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: colors.accent }}>{formatVND(subtotal)}</Text>
              </View>
              <Button title="Thanh toán" variant="accent" icon="arrow-forward" onPress={checkout} style={{ paddingHorizontal: 22 }} />
            </View>
          )}
        </>
      )}
    </View>
  );
}
