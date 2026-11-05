import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/lib/theme';
import { formatVND } from '@/lib/format';
import { getPrices, isSoldOut } from '@/lib/pricing';
import type { Product } from '@/lib/types';

export default function ProductCard({
  product,
  onWish,
  width,
}: {
  product: Product;
  onWish?: (p: Product) => void;
  width?: number;
}) {
  const sold = isSoldOut(product);
  const pr = getPrices(product);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: String(product.id) } })}
      style={[{ width: width ?? '100%' }]}
    >
      <View style={styles.imgWrap}>
        <Image
          source={{ uri: product.imageUrlFront }}
          style={[StyleSheet.absoluteFill, sold && { opacity: 0.5 }]}
          contentFit="cover"
          transition={200}
        />
        {sold ? (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>Hết hàng</Text>
          </View>
        ) : pr.pct > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={styles.badgeText}>-{pr.pct}%</Text>
          </View>
        ) : null}
        {onWish && (
          <Pressable hitSlop={8} onPress={() => onWish(product)} style={styles.heart}>
            <Ionicons name="heart-outline" size={18} color={colors.primary} />
          </Pressable>
        )}
      </View>
      <Text numberOfLines={2} style={styles.name}>
        {product.name}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
        <Text style={styles.price}>{formatVND(pr.current)}</Text>
        {pr.original ? <Text style={styles.old}>{formatVND(pr.original)}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  imgWrap: { aspectRatio: 3 / 4, backgroundColor: '#EEEDE9', overflow: 'hidden' },
  badge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { marginTop: 10, fontSize: 12, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.3 },
  price: { fontSize: 13, fontWeight: '900', color: colors.accent },
  old: { fontSize: 11, color: colors.faint, textDecorationLine: 'line-through' },
});
