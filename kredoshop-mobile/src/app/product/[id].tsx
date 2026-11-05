import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductCard from '@/components/ProductCard';
import WishlistSheet from '@/components/WishlistSheet';
import { Button, Loading } from '@/components/ui';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { setCheckout } from '@/lib/checkoutStore';
import { formatVND } from '@/lib/format';
import { getPrices, isSoldOut, mergeSizes } from '@/lib/pricing';
import { colors, label } from '@/lib/theme';
import type { Product } from '@/lib/types';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, cartId, refreshCart } = useAuth();
  const toast = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [others, setOthers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [adding, setAdding] = useState(false);
  const [wish, setWish] = useState<Product | null>(null);
  const scroller = useRef<React.ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    setLoading(true);
    setSize(null);
    setQty(1);
    scroller.current?.scrollTo({ y: 0, animated: false });
    (async () => {
      try {
        const [p, all] = await Promise.all([api.get(`/products/${id}`, false), api.get('/products', false).catch(() => null)]);
        setProduct(unwrap<Product>(p) || null);
        const list: Product[] = unwrap(all) || [];
        setOthers(
          list
            .filter((x) => x.id !== Number(id) && (!x.status || x.status === 'ACTIVE'))
            .sort((a, b) => +new Date(b.updatedAt ?? 0) - +new Date(a.updatedAt ?? 0))
            .slice(0, 6),
        );
      } catch (e: any) {
        setError(e.message || 'Không tìm thấy sản phẩm');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const sizes = useMemo(() => (product ? mergeSizes(product) : []), [product]);
  const images = useMemo(() => [product?.imageUrlFront, product?.imageUrlBack].filter(Boolean) as string[], [product]);

  const back = (
    <View style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', zIndex: 5 }}>
      <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={roundBtn}>
        <Ionicons name="chevron-back" size={22} />
      </Pressable>
      {product && (
        <Pressable
          onPress={() => (user ? setWish(product) : toast('Vui lòng đăng nhập để dùng danh sách yêu thích', 'info'))}
          style={roundBtn}
        >
          <Ionicons name="heart-outline" size={20} />
        </Pressable>
      )}
    </View>
  );

  if (loading) return <View style={{ flex: 1 }}>{back}<Loading /></View>;
  if (error || !product)
    return (
      <View style={{ flex: 1 }}>
        {back}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontWeight: '900' }}>{error || 'Không tìm thấy sản phẩm'}</Text>
        </View>
      </View>
    );

  const sold = isSoldOut(product);
  const pr = getPrices(product);

  const validate = () => {
    if (sold) return toast('Sản phẩm này hiện đang hết hàng.', 'error'), false;
    if (sizes.length && !size) return toast('Vui lòng chọn kích cỡ', 'info'), false;
    if (!user) {
      toast('Vui lòng đăng nhập trước', 'info');
      router.push('/login');
      return false;
    }
    return true;
  };

  const addToCart = async () => {
    if (!validate() || !cartId) return;
    setAdding(true);
    try {
      const sd =
        sizes.length && size
          ? (product.sizeDetails?.find((s) => s.sizeName === size && s.quantity > 0) ?? product.sizeDetails?.find((s) => s.sizeName === size))
          : undefined;
      await api.post('/cart-details/add-to-cart', {
        productId: Number(id),
        cartId,
        quantity: qty,
        ...(sd?.id ? { sizeDetailId: sd.id } : {}),
      });
      await api.put(`/carts/update/${cartId}`, { quantity: qty, totalAmount: product.costPrice || product.price });
      await refreshCart();
      toast('Đã thêm vào giỏ hàng!', 'success');
    } catch (e: any) {
      toast(e.message || 'Không thể thêm vào giỏ hàng.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const buyNow = () => {
    if (!validate()) return;
    setCheckout({ kind: 'buynow', product, quantity: qty, size });
    router.push('/checkout');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.secondary }}>
      {back}
      <ScrollView ref={scroller} contentContainerStyle={{ paddingBottom: 120 }}>
        <View>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(u) => u}
            onMomentumScrollEnd={(e) => setImg(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => <Image source={{ uri: item }} style={{ width, height: width * 1.3, backgroundColor: '#EEEDE9' }} contentFit="cover" />}
          />
          {images.length > 1 && (
            <View style={{ position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row', gap: 6 }}>
              {images.map((_, i) => (
                <View key={i} style={{ width: i === img ? 22 : 6, height: 6, borderRadius: 3, backgroundColor: i === img ? colors.accent : 'rgba(255,255,255,0.8)' }} />
              ))}
            </View>
          )}
        </View>

        <View style={{ padding: 16 }}>
          {!!product.category?.name && <Text style={[label, { color: colors.accent, letterSpacing: 3 }]}>{product.category.name}</Text>}
          <Text style={{ fontSize: 24, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.5, marginTop: 6 }}>{product.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: colors.accent }}>{formatVND(pr.current)}</Text>
            {pr.original ? <Text style={{ color: colors.faint, textDecorationLine: 'line-through' }}>{formatVND(pr.original)}</Text> : null}
            {pr.pct > 0 && !sold && (
              <View style={{ backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>-{pr.pct}%</Text>
              </View>
            )}
          </View>

          <Text style={[label, { color: colors.faint, marginTop: 24, marginBottom: 10 }]}>Kích cỡ</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {sizes.length === 0 && <Text style={{ color: colors.faint, fontSize: 12 }}>Không có sẵn kích cỡ nào</Text>}
            {sizes.map((s) => {
              const out = s.quantity <= 0;
              const on = size === s.sizeName;
              return (
                <Pressable
                  key={s.sizeName}
                  disabled={out}
                  onPress={() => setSize(s.sizeName)}
                  style={{
                    minWidth: 52,
                    paddingVertical: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: on ? colors.primary : colors.border,
                    backgroundColor: on ? colors.primary : '#fff',
                    opacity: out ? 0.35 : 1,
                  }}
                >
                  <Text style={{ fontWeight: '900', color: on ? '#fff' : colors.primary, textDecorationLine: out ? 'line-through' : 'none' }}>{s.sizeName}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[label, { color: colors.faint, marginTop: 24, marginBottom: 10 }]}>Số lượng</Text>
          <View style={{ flexDirection: 'row', alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' }}>
            <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} style={{ padding: 12 }}>
              <Ionicons name="remove" size={18} />
            </Pressable>
            <Text style={{ minWidth: 40, textAlign: 'center', alignSelf: 'center', fontWeight: '900' }}>{qty}</Text>
            <Pressable onPress={() => setQty((q) => q + 1)} style={{ padding: 12 }}>
              <Ionicons name="add" size={18} />
            </Pressable>
          </View>

          {!!product.description && (
            <>
              <Text style={[label, { color: colors.faint, marginTop: 28, marginBottom: 8 }]}>Mô tả sản phẩm</Text>
              <Text style={{ color: 'rgba(17,17,17,0.65)', lineHeight: 20, fontSize: 13 }}>{product.description}</Text>
            </>
          )}
        </View>

        {others.length > 0 && (
          <View style={{ paddingTop: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 14 }}>Có thể bạn thích</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
              {others.map((p) => (
                <ProductCard key={p.id} product={p} width={150} />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border, padding: 12, paddingBottom: insets.bottom + 12, flexDirection: 'row', gap: 10 }}>
        <Button title={sold ? 'Hết hàng' : 'Thêm giỏ'} variant="outline" icon="bag-add-outline" disabled={sold} loading={adding} onPress={addToCart} style={{ flex: 1 }} />
        <Button title="Mua ngay" variant="accent" disabled={sold} onPress={buyNow} style={{ flex: 1 }} />
      </View>
      <WishlistSheet product={wish} onClose={() => setWish(null)} />
    </View>
  );
}

const roundBtn = {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(255,255,255,0.92)',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
