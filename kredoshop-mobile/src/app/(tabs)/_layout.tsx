import React from 'react';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

type IconName = keyof typeof Ionicons.glyphMap;
const icon = (a: IconName, b: IconName) =>
  function TabIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
    return <Ionicons name={focused ? a : b} size={size} color={color as string} />;
  };

export default function TabsLayout() {
  const { cartCount } = useAuth();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: 'rgba(17,17,17,0.4)',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
        sceneStyle: { backgroundColor: colors.secondary },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Trang chủ', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="products" options={{ title: 'Sản phẩm', tabBarIcon: icon('shirt', 'shirt-outline') }} />
      <Tabs.Screen name="wishlists" options={{ title: 'Yêu thích', tabBarIcon: icon('heart', 'heart-outline') }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Giỏ hàng',
          tabBarIcon: icon('bag', 'bag-outline'),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, fontSize: 10 },
        }}
      />
      <Tabs.Screen name="account" options={{ title: 'Tài khoản', tabBarIcon: icon('person', 'person-outline') }} />
    </Tabs>
  );
}
