import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, label } from '@/lib/theme';

export function Button({
  title,
  onPress,
  variant = 'dark',
  loading,
  disabled,
  icon,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'dark' | 'accent' | 'outline' | 'light';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = { dark: colors.primary, accent: colors.accent, outline: 'transparent', light: '#fff' }[variant];
  const fg = variant === 'outline' || variant === 'light' ? colors.primary : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        variant === 'outline' && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
          {icon && <Ionicons name={icon} size={14} color={fg} />}
        </View>
      )}
    </Pressable>
  );
}

export function Field({
  label: l,
  error,
  icon,
  right,
  ...props
}: TextInputProps & { label: string; error?: string; icon?: keyof typeof Ionicons.glyphMap; right?: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={[label, { color: colors.faint, marginBottom: 6 }]}>{l}</Text>
      <View style={[styles.field, error ? { borderBottomColor: colors.accent } : null]}>
        {icon && <Ionicons name={icon} size={18} color={colors.faint} />}
        <TextInput
          placeholderTextColor="rgba(17,17,17,0.2)"
          autoCapitalize="none"
          {...props}
          style={[styles.input, props.style]}
        />
        {right}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

export function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow?: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
      <View>
        {eyebrow && <Text style={[label, { color: colors.accent, letterSpacing: 3, marginBottom: 4 }]}>{eyebrow}</Text>}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action && (
        <Pressable onPress={onAction}>
          <Text style={[label, { color: colors.accent }]}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function Empty({ icon, title, sub, action }: { icon: keyof typeof Ionicons.glyphMap; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 }}>
      <Ionicons name={icon} size={44} color="rgba(17,17,17,0.15)" />
      <Text style={[styles.sectionTitle, { marginTop: 14, fontSize: 15, textAlign: 'center' }]}>{title}</Text>
      {sub && <Text style={{ color: colors.faint, fontSize: 12, textAlign: 'center', marginTop: 6 }}>{sub}</Text>}
      {action && <View style={{ marginTop: 20, alignSelf: 'stretch' }}>{action}</View>}
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

export const styles = StyleSheet.create({
  btn: { paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  btnText: { fontSize: 11, fontWeight: '900', letterSpacing: 2.5, textTransform: 'uppercase' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 2, borderBottomColor: 'rgba(17,17,17,0.08)' },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, fontWeight: '700', color: colors.primary },
  error: { color: colors.accent, fontSize: 11, marginTop: 4, fontWeight: '600' },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: colors.primary, textTransform: 'uppercase', letterSpacing: -0.5 },
});
