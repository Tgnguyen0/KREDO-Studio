import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradientFallback } from '@/components/Overlay';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductCard from '@/components/ProductCard';
import WishlistSheet from '@/components/WishlistSheet';
import { Button, Loading, SectionTitle } from '@/components/ui';
import { useCatalog } from '@/lib/useProducts';
import { useAuth } from '@/lib/auth';
import { colors, label } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import type { Product } from '@/lib/types';

const HERO = 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1974&auto=format&fit=crop';
const FALLBACK_CAT = 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop';

const VALUES = [
  { icon: 'car-outline', t: 'Vận chuyển nhanh', d: 'Giao hàng hỏa tốc 24-48 giờ tại các thành phố lớn.' },
  { icon: 'ribbon-outline', t: 'Chất lượng cao', d: 'Chất liệu vải tuyển chọn kỹ lưỡng đạt chuẩn xuất khẩu.' },
  { icon: 'trending-up-outline', t: 'Phong cách dẫn đầu', d: 'Cập nhật xu hướng thời trang tối giản mới nhất.' },
] as const;

export default function Home() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { products, categories, loading, reload } = useCatalog();
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<'new' | 'best'>('new');
  const [wish, setWish] = useState<Product | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const active = useMemo(() => products.filter((p) => !p.status || p.status === 'ACTIVE'), [products]);
  const list = useMemo(() => {
    const c = [...active];
    return tab === 'new'
      ? c.sort((a, b) => +new Date(b.updatedAt ?? 0) - +new Date(a.updatedAt ?? 0)).slice(0, 6)
      : c.sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0)).slice(0, 6);
  }, [active, tab]);

  const cats = useMemo(
    () =>
      categories.slice(0, 6).map((c) => ({
        ...c,
        image: products.find((p) => p.category?.id === c.id)?.imageUrlFront || FALLBACK_CAT,
      })),
    [categories, products],
  );

  const onWish = (p: Product) => {
    if (!user) return toast('Vui lòng đăng nhập để dùng danh sách yêu thích', 'info');
    setWish(p);
  };
  const cardW = (width - 16 * 2 - 12) / 2;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.accent}
          onRefresh={async () => {
            setRefreshing(true);
            await reload();
            setRefreshing(false);
          }}
        />
      }
    >
      {/* HERO */}
      <View style={{ height: 520, backgroundColor: colors.primary }}>
        <Image source={{ uri: HERO }} style={[StyleSheet.absoluteFill, { opacity: 0.75 }]} contentFit="cover" />
        <LinearGradientFallback />
        <View style={{ flex: 1, justifyContent: 'flex-end', padding: 20, paddingBottom: 36, paddingTop: insets.top }}>
          <Text style={[label, { color: '#EF4444', letterSpacing: 5, marginBottom: 12 }]}>Season 2026</Text>
          <Text style={styles.heroTitle}>KREDO</Text>
          <Text style={[styles.heroTitle, { color: '#EF4444' }]}>STUDIO</Text>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 20, marginTop: 14, marginBottom: 22 }}>
            Định hình phong cách tối giản, nâng tầm bản sắc cá nhân thông qua ngôn ngữ thiết kế đương đại.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Mua sắm ngay" variant="light" style={{ flex: 1 }} onPress={() => router.push('/products')} />
            <Button
              title="Câu chuyện"
              variant="outline"
              style={{ flex: 1, borderColor: 'rgba(255,255,255,0.3)' }}
              onPress={() => router.push('/about')}
            />
          </View>
        </View>
      </View>

      {loading ? (
        <View style={{ height: 240 }}>
          <Loading />
        </View>
      ) : (
        <>
          {/* CATEGORIES */}
          {cats.length > 0 && (
            <View style={{ paddingTop: 36 }}>
              <View style={{ paddingHorizontal: 16 }}>
                <SectionTitle eyebrow="Bộ sưu tập" title="Danh mục chọn lọc" />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}>
                {cats.map((c, i) => (
                  <Pressable key={c.id} onPress={() => router.push({ pathname: '/products', params: { category: String(c.id) } })}>
                    <View style={styles.catImg}>
                      <Image source={{ uri: c.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    </View>
                    <Text style={styles.catName}>
                      <Text style={{ color: colors.accent }}>0{i + 1} </Text>
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* NEW / BEST */}
          <View style={{ backgroundColor: '#fff', marginTop: 36, paddingVertical: 28, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <View style={{ flexDirection: 'row', gap: 18 }}>
                {(['new', 'best'] as const).map((k) => (
                  <Pressable key={k} onPress={() => setTab(k)}>
                    <Text style={[styles.tab, tab === k && styles.tabOn]}>{k === 'new' ? 'Hàng mới về' : 'Bán chạy'}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={() => router.push('/products')}>
                <Text style={[label, { color: colors.accent }]}>Xem tất cả</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, rowGap: 20 }}>
              {list.map((p) => (
                <ProductCard key={p.id} product={p} width={cardW} onWish={onWish} />
              ))}
            </View>
          </View>

          {/* VALUES */}
          <View style={{ padding: 16, paddingTop: 28, gap: 12 }}>
            {VALUES.map((v) => (
              <View key={v.t} style={styles.value}>
                <View style={styles.valueIcon}>
                  <Ionicons name={v.icon} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[label, { color: colors.primary, marginBottom: 4 }]}>{v.t}</Text>
                  <Text style={{ color: colors.faint, fontSize: 12, lineHeight: 17 }}>{v.d}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
      <WishlistSheet product={wish} onClose={() => setWish(null)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heroTitle: { fontSize: 56, fontWeight: '900', color: '#fff', letterSpacing: -2, lineHeight: 54 },
  catImg: { width: 130, height: 190, borderRadius: 65, overflow: 'hidden', backgroundColor: '#EEEDE9' },
  catName: { marginTop: 10, textAlign: 'center', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', color: colors.primary },
  tab: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase', color: 'rgba(17,17,17,0.25)', paddingBottom: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabOn: { color: colors.primary, borderBottomColor: colors.accent },
  value: { flexDirection: 'row', gap: 14, backgroundColor: '#fff', padding: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  valueIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
});
