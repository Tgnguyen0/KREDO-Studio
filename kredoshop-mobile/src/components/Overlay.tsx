import React from 'react';
import { StyleSheet, View } from 'react-native';

// Lớp phủ tối dần từ trên xuống (không cần thêm thư viện gradient).
export function LinearGradientFallback() {
  const steps = [0.15, 0.25, 0.4, 0.55, 0.7, 0.8];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {steps.map((o, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: `rgba(0,0,0,${o})` }} />
      ))}
    </View>
  );
}
