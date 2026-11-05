import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

type Row = { icon: keyof typeof Ionicons.glyphMap; t: string; to: string; auth?: boolean };
const ROWS: Row[] = [
  { icon: 'receipt-outline', t: 'Đơn hàng của tôi', to: '/orders', auth: true },
  { icon: 'person-circle-outline', t: 'Hồ sơ & địa chỉ', to: '/profile', auth: true },
  { icon: 'information-circle-outline', t: 'Về KREDO', to: '/about' },
  { icon: 'swap-horizontal-outline', t: 'Chính sách đổi trả', to: '/policy' },
];

export default function Account() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const name = (user?.fullName as string) || user?.username || '';

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + 12, padding: 16, paddingBottom: 32 }}>
      <Text style={{ fontSize: 26, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -1, marginBottom: 16 }}>Tài khoản</Text>
      {user ? (
        <View style={{ backgroundColor: colors.primary, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20 }}>{name.charAt(0).toUpperCase() || 'K'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>{name}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>@{user.username}</Text>
          </View>
        </View>
      ) : (
        <View style={{ backgroundColor: '#fff', padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 20, gap: 10 }}>
          <Text style={{ fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>Chào mừng đến KREDO</Text>
          <Text style={{ color: colors.faint, fontSize: 12, marginBottom: 6 }}>Đăng nhập để mua sắm, theo dõi đơn hàng và lưu sản phẩm yêu thích.</Text>
          <Button title="Đăng nhập" onPress={() => router.push('/login')} />
          <Button title="Tạo tài khoản" variant="outline" onPress={() => router.push('/register')} />
        </View>
      )}

      <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border }}>
        {ROWS.filter((r) => !r.auth || user).map((r, i) => (
          <Pressable
            key={r.to}
            onPress={() => router.push(r.to as never)}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}
          >
            <Ionicons name={r.icon} size={22} color={colors.primary} />
            <Text style={{ flex: 1, fontWeight: '800', fontSize: 13, textTransform: 'uppercase' }}>{r.t}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.faint} />
          </Pressable>
        ))}
      </View>

      {user && (
        <Button
          title="Đăng xuất"
          variant="outline"
          style={{ marginTop: 20 }}
          onPress={() => Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [{ text: 'Hủy', style: 'cancel' }, { text: 'Đăng xuất', style: 'destructive', onPress: logout }])}
        />
      )}
    </ScrollView>
  );
}
