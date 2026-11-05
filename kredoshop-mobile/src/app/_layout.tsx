import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/lib/toast';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  return (
    <ToastProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.secondary },
            headerShadowVisible: false,
            headerTintColor: colors.primary,
            headerTitleStyle: { fontWeight: '900', fontSize: 15 },
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: colors.secondary },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ title: 'Đăng ký' }} />
          <Stack.Screen name="forgot-password" options={{ title: 'Quên mật khẩu' }} />
          <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="checkout" options={{ title: 'Thanh toán' }} />
          <Stack.Screen name="payment" options={{ title: 'Thanh toán QR', headerBackVisible: false }} />
          <Stack.Screen name="orders" options={{ title: 'Đơn hàng của tôi' }} />
          <Stack.Screen name="profile" options={{ title: 'Hồ sơ & địa chỉ' }} />
          <Stack.Screen name="wishlists/[id]" options={{ title: 'Danh sách yêu thích' }} />
          <Stack.Screen name="about" options={{ title: 'Về KREDO' }} />
          <Stack.Screen name="policy" options={{ title: 'Chính sách đổi trả' }} />
        </Stack>
      </AuthProvider>
    </ToastProvider>
  );
}
