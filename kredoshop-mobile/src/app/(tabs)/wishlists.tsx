import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Empty, Loading } from '@/components/ui';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { colors, label } from '@/lib/theme';
import type { Wishlist } from '@/lib/types';

export default function Wishlists() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Wishlist | 'new' | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const load = useCallback(async () => {
    if (!user) return setLoading(false);
    try {
      setItems(unwrap(await api.get('/wishlists')) || []);
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

  const open = (w: Wishlist | 'new') => {
    setEditing(w);
    setName(w === 'new' ? '' : w.name);
    setDesc(w === 'new' ? '' : w.description || '');
  };

  const save = async () => {
    if (!name.trim()) return;
    try {
      if (editing === 'new') {
        const wl: Wishlist = unwrap(await api.post('/wishlists', { name: name.trim(), description: desc.trim() || null }));
        setItems((p) => [...p, wl]);
        toast(`Đã tạo "${wl.name}"`, 'success');
      } else if (editing) {
        const wl: Wishlist = unwrap(await api.put(`/wishlists/${editing.id}`, { name: name.trim(), description: desc.trim() || null }));
        setItems((p) => p.map((i) => (i.id === wl.id ? { ...i, ...wl } : i)));
        toast('Đã cập nhật', 'success');
      }
      setEditing(null);
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const remove = (w: Wishlist) =>
    Alert.alert('Xóa danh sách?', `Bạn sắp xóa "${w.name}". Hành động này không thể hoàn tác.`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/wishlists/${w.id}`);
            setItems((p) => p.filter((i) => i.id !== w.id));
          } catch (e: any) {
            toast(e.message, 'error');
          }
        },
      },
    ]);

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 26, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -1 }}>Yêu thích</Text>
        {user && (
          <Pressable onPress={() => open('new')} style={{ backgroundColor: colors.primary, padding: 10 }}>
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        )}
      </View>
      {!user ? (
        <Empty
          icon="heart-outline"
          title="Đăng nhập để lưu sản phẩm yêu thích"
          action={<Button title="Đăng nhập" onPress={() => router.push('/login')} />}
        />
      ) : loading ? (
        <Loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onRefresh={load}
          refreshing={false}
          ListEmptyComponent={<Empty icon="heart-outline" title="Chưa có danh sách nào" sub="Nhấn + để tạo danh sách đầu tiên." />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/wishlists/[id]', params: { id: String(item.id), name: item.name } })}
              style={{ backgroundColor: '#fff', padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '900', fontSize: 15, textTransform: 'uppercase' }}>{item.name}</Text>
                {!!item.description && (
                  <Text numberOfLines={2} style={{ color: colors.faint, fontSize: 12, marginTop: 2 }}>
                    {item.description}
                  </Text>
                )}
                {item.itemCount !== undefined && item.itemCount >= 0 && (
                  <Text style={[label, { color: colors.accent, marginTop: 8 }]}>{item.itemCount} sản phẩm</Text>
                )}
              </View>
              <Pressable hitSlop={8} onPress={() => open(item)} style={{ padding: 8 }}>
                <Ionicons name="create-outline" size={20} color={colors.primary} />
              </Pressable>
              <Pressable hitSlop={8} onPress={() => remove(item)} style={{ padding: 8 }}>
                <Ionicons name="trash-outline" size={20} color={colors.accent} />
              </Pressable>
            </Pressable>
          )}
        />
      )}

      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#fff', padding: 20 }}>
            <Text style={[label, { fontSize: 12, color: colors.primary, marginBottom: 16 }]}>
              {editing === 'new' ? 'Tạo danh sách mới' : 'Sửa danh sách'}
            </Text>
            <TextInput value={name} onChangeText={setName} placeholder="Tên danh sách" style={{ borderBottomWidth: 2, borderBottomColor: colors.border, paddingVertical: 10, fontWeight: '700', marginBottom: 14 }} />
            <TextInput value={desc} onChangeText={setDesc} placeholder="Mô tả (tùy chọn)" multiline style={{ borderBottomWidth: 2, borderBottomColor: colors.border, paddingVertical: 10, marginBottom: 20 }} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Hủy" variant="outline" style={{ flex: 1 }} onPress={() => setEditing(null)} />
              <Button title="Lưu" style={{ flex: 1 }} onPress={save} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
