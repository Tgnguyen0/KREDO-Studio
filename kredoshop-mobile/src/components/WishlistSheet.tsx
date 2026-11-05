import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, unwrap } from '@/lib/api';
import { colors, label } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import type { Product, Wishlist } from '@/lib/types';

export default function WishlistSheet({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const toast = useToast();
  const [lists, setLists] = useState<(Wishlist & { has?: boolean })[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (!product) return;
    (async () => {
      setLoading(true);
      try {
        const ls: Wishlist[] = unwrap(await api.get('/wishlists')) || [];
        const withFlag = await Promise.all(
          ls.map(async (l) => {
            try {
              const items: any[] = unwrap(await api.get(`/wishlists/${l.id}/items`)) || [];
              return { ...l, has: items.some((i) => i.productId === product.id) };
            } catch {
              return { ...l, has: false };
            }
          }),
        );
        setLists(withFlag);
      } catch (e: any) {
        toast(e.message, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [product, toast]);

  const toggle = async (l: Wishlist & { has?: boolean }) => {
    if (!product) return;
    try {
      if (l.has) await api.del(`/wishlists/${l.id}/items/${product.id}`);
      else await api.post(`/wishlists/${l.id}/items`, { productId: product.id });
      setLists((p) => p.map((x) => (x.id === l.id ? { ...x, has: !l.has } : x)));
      toast(l.has ? `Đã xóa khỏi "${l.name}"` : `Đã thêm vào "${l.name}"`, 'success');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const create = async () => {
    if (!name.trim() || !product) return;
    try {
      const wl: Wishlist = unwrap(await api.post('/wishlists', { name: name.trim(), description: null }));
      await api.post(`/wishlists/${wl.id}/items`, { productId: product.id });
      setLists((p) => [...p, { ...wl, has: true }]);
      setName('');
      toast(`Đã tạo "${wl.name}"`, 'success');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  return (
    <Modal visible={!!product} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
      <View style={{ backgroundColor: '#fff', padding: 20, paddingBottom: 36, maxHeight: '70%' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={[label, { fontSize: 12, color: colors.primary }]}>Lưu vào danh sách yêu thích</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={22} />
          </Pressable>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />
        ) : (
          <FlatList
            data={lists}
            keyExtractor={(i) => String(i.id)}
            ListEmptyComponent={<Text style={{ color: colors.faint, paddingVertical: 16 }}>Chưa có danh sách nào.</Text>}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => toggle(item)}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}
              >
                <Ionicons name={item.has ? 'heart' : 'heart-outline'} size={20} color={item.has ? colors.accent : colors.primary} />
                <Text style={{ marginLeft: 12, fontWeight: '800', flex: 1 }}>{item.name}</Text>
              </Pressable>
            )}
          />
        )}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tên danh sách mới…"
            style={{ flex: 1, borderBottomWidth: 2, borderBottomColor: colors.border, paddingVertical: 8, fontWeight: '700' }}
          />
          <Pressable onPress={create} style={{ backgroundColor: colors.primary, paddingHorizontal: 16, justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 1.5 }}>TẠO</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
