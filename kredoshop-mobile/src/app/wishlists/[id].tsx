import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, useWindowDimensions } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import ProductCard from '@/components/ProductCard';
import { Empty, Loading } from '@/components/ui';
import { api, unwrap } from '@/lib/api';
import { useToast } from '@/lib/toast';
import type { Product } from '@/lib/types';

export default function WishlistDetail() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { width } = useWindowDimensions();
  const toast = useToast();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const raw: any[] = unwrap(await api.get(`/wishlists/${id}/items`)) || [];
      setItems(
        raw.map((i) => ({
          id: i.productId,
          name: i.productName,
          imageUrlFront: i.productImage,
          price: i.productPrice,
          costPrice: i.productCostPrice ?? i.productPrice,
          discountAmount: i.discountAmount || 0,
          quantity: i.productQuantity ?? 1,
        })),
      );
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);
  useEffect(() => {
    load();
  }, [load]);

  const cardW = (width - 32 - 12) / 2;
  return (
    <>
      <Stack.Screen options={{ title: name || 'Danh sách yêu thích' }} />
      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ rowGap: 20, paddingVertical: 16 }}
          ListEmptyComponent={<Empty icon="heart-outline" title="Danh sách trống" sub="Thêm sản phẩm bằng biểu tượng trái tim." />}
          renderItem={({ item }) => <ProductCard product={item} width={cardW} />}
        />
      )}
    </>
  );
}
