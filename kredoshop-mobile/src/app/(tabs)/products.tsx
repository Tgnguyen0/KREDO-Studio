import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductCard from '@/components/ProductCard';
import WishlistSheet from '@/components/WishlistSheet';
import { Empty, Loading } from '@/components/ui';
import { useCatalog } from '@/lib/useProducts';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { colors, label } from '@/lib/theme';
import type { Product } from '@/lib/types';

const SORTS = [
  { k: 'newest', t: 'Mới nhất' },
  { k: 'asc', t: 'Giá tăng' },
  { k: 'desc', t: 'Giá giảm' },
  { k: 'best', t: 'Bán chạy' },
] as const;

export default function Products() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ category?: string }>();
  const { products, categories, loading, error, reload } = useCatalog();
  const { user } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [sort, setSort] = useState<(typeof SORTS)[number]['k']>('newest');
  const [wish, setWish] = useState<Product | null>(null);

  const selected = cat ?? params.category ?? 'all';

  const data = useMemo(() => {
    let l = products.filter((p) => !p.status || p.status === 'ACTIVE');
    if (q.trim()) l = l.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()));
    if (selected !== 'all') l = l.filter((p) => p.category?.id === Number(selected));
    const price = (p: Product) => p.costPrice || p.price;
    switch (sort) {
      case 'asc':
        return l.sort((a, b) => price(a) - price(b));
      case 'desc':
        return l.sort((a, b) => price(b) - price(a));
      case 'best':
        return l.sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0));
      default:
        return l.sort((a, b) => +new Date(b.updatedAt ?? 0) - +new Date(a.updatedAt ?? 0));
    }
  }, [products, q, selected, sort]);

  const cardW = (width - 32 - 12) / 2;
  const chip = (on: boolean) => ({
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: on ? colors.primary : '#fff',
    borderWidth: 1,
    borderColor: on ? colors.primary : colors.border,
  });

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Text style={{ fontSize: 26, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -1 }}>Cửa hàng</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, marginTop: 12 }}>
          <Ionicons name="search" size={18} color={colors.faint} />
          <TextInput value={q} onChangeText={setQ} placeholder="Tìm sản phẩm…" style={{ flex: 1, paddingVertical: 12, fontWeight: '600' }} />
          {!!q && (
            <Pressable onPress={() => setQ('')}>
              <Ionicons name="close-circle" size={18} color={colors.faint} />
            </Pressable>
          )}
        </View>
      </View>
      <View style={{ height: 52 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
          {[{ id: 'all', name: 'Tất cả' }, ...categories.map((c) => ({ id: String(c.id), name: c.name }))].map((c) => (
            <Pressable key={c.id} onPress={() => setCat(c.id)} style={chip(selected === c.id)}>
              <Text style={[label, { color: selected === c.id ? '#fff' : colors.primary }]}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View style={{ height: 40 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 16, alignItems: 'center' }}>
          {SORTS.map((s) => (
            <Pressable key={s.k} onPress={() => setSort(s.k)}>
              <Text style={[label, { color: sort === s.k ? colors.accent : colors.faint }]}>{s.t}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <Loading />
      ) : error ? (
        <Empty icon="cloud-offline-outline" title="Không tải được sản phẩm" sub={error} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => String(i.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ rowGap: 20, paddingTop: 8, paddingBottom: 24 }}
          onRefresh={reload}
          refreshing={false}
          ListEmptyComponent={<Empty icon="search-outline" title="Không tìm thấy sản phẩm" sub="Thử đổi từ khóa hoặc danh mục." />}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              width={cardW}
              onWish={(p) => (user ? setWish(p) : toast('Vui lòng đăng nhập để dùng danh sách yêu thích', 'info'))}
            />
          )}
        />
      )}
      <WishlistSheet product={wish} onClose={() => setWish(null)} />
    </View>
  );
}
