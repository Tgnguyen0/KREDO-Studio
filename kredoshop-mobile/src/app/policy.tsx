import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors, label } from '@/lib/theme';

const CONDITIONS = [
  'Sản phẩm phải còn nguyên tem mác, bao bì gốc và chưa qua sử dụng.',
  'Không có dấu hiệu giặt ủi, mùi lạ (nước hoa, cơ thể) hoặc hư hỏng do tác động bên ngoài.',
  'Áp dụng cho tất cả sản phẩm nguyên giá (không áp dụng hàng giảm giá sâu hoặc xả kho).',
];
const STEPS = [
  { t: 'Kiểm tra điều kiện', d: 'Đảm bảo sản phẩm của bạn đáp ứng các tiêu chuẩn đổi trả của KREDO.' },
  { t: 'Liên hệ hỗ trợ', d: 'Gửi yêu cầu qua Zalo hoặc Hotline kèm mã đơn hàng và lý do cụ thể.' },
  { t: 'Đóng gói & Gửi hàng', d: 'Bọc kỹ sản phẩm trong hộp/túi gốc và gửi về địa chỉ kho của chúng tôi.' },
  { t: 'Xác nhận & Hoàn tất', d: 'KREDO sẽ kiểm tra sản phẩm và tiến hành đổi size hoặc hoàn tiền trong 3-5 ngày.' },
];

export default function Policy() {
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Text style={[label, { color: colors.primary, fontSize: 12, marginBottom: 12 }]}>Điều kiện đổi trả</Text>
      {CONDITIONS.map((c) => (
        <View key={c} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <View style={{ width: 6, height: 6, backgroundColor: colors.accent, marginTop: 7 }} />
          <Text style={{ flex: 1, lineHeight: 20, color: 'rgba(17,17,17,0.7)' }}>{c}</Text>
        </View>
      ))}
      <Text style={[label, { color: colors.primary, fontSize: 12, marginTop: 24, marginBottom: 12 }]}>Quy trình</Text>
      {STEPS.map((s, i) => (
        <View key={s.t} style={{ flexDirection: 'row', gap: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 10 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: colors.accent }}>0{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[label, { color: colors.primary, marginBottom: 4 }]}>{s.t}</Text>
            <Text style={{ color: colors.faint, lineHeight: 18 }}>{s.d}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
