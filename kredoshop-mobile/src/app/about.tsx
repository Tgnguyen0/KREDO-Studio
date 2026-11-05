import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { router } from 'expo-router';
import { colors, label } from '@/lib/theme';

const VALUES = [
  { t: 'Tối giản', d: 'Sức mạnh nằm ở sự tinh gọn. Chúng tôi loại bỏ những chi tiết rườm rà.' },
  { t: 'Chất lượng', d: 'Không thỏa hiệp với sự tầm thường. Mỗi đường kim mũi chỉ là một lời hứa.' },
  { t: 'Cộng đồng', d: 'Kết nối những tâm hồn đồng điệu qua phong cách sống tinh tế.' },
];
const CRAFT = [
  { t: 'Chất liệu', d: 'Lựa chọn những sợi vải tự nhiên, bền bỉ và mang lại cảm giác thoải mái tuyệt đối.' },
  { t: 'Phom dáng', d: 'Tỉ lệ hình khối được tính toán chính xác để tôn vinh vóc dáng người mặc.' },
];

export default function About() {
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Text style={[label, { color: colors.accent, letterSpacing: 4 }]}>Câu chuyện</Text>
      <Text style={{ fontSize: 48, fontWeight: '900', letterSpacing: -2, textTransform: 'uppercase', lineHeight: 48, marginVertical: 12 }}>KREDO</Text>
      <Text style={{ fontSize: 16, fontWeight: '600', lineHeight: 24 }}>Định hình phong cách tối giản, nâng tầm bản sắc cá nhân thông qua ngôn ngữ thiết kế đương đại và nghệ thuật cắt may tỉ mỉ.</Text>
      <View style={{ marginTop: 28, gap: 16 }}>
        {CRAFT.map((c) => (
          <View key={c.t}>
            <Text style={[label, { color: colors.primary, marginBottom: 4 }]}>{c.t}</Text>
            <Text style={{ color: colors.faint, lineHeight: 20 }}>{c.d}</Text>
          </View>
        ))}
      </View>
      <View style={{ marginTop: 32, gap: 12 }}>
        {VALUES.map((v) => (
          <View key={v.t} style={{ backgroundColor: colors.primary, padding: 20 }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 }}>{v.t}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 20 }}>{v.d}</Text>
          </View>
        ))}
      </View>
      <Button title="Mua sắm ngay" variant="accent" style={{ marginTop: 28 }} onPress={() => router.push('/products')} />
    </ScrollView>
  );
}
