import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './theme';

type Kind = 'success' | 'error' | 'info';
type Ctx = (msg: string, kind?: Kind) => void;
const ToastCtx = createContext<Ctx>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<{ msg: string; kind: Kind } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<Ctx>(
    (msg, kind = 'info') => {
      if (timer.current) clearTimeout(timer.current);
      setState({ msg, kind });
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setState(null));
      }, 2600);
    },
    [opacity],
  );

  const bg = state?.kind === 'success' ? colors.success : state?.kind === 'error' ? colors.accent : colors.primary;
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {state && (
        <Animated.View pointerEvents="none" style={[styles.wrap, { top: insets.top + 8, opacity, backgroundColor: bg }]}>
          <Text style={styles.text}>{state.msg}</Text>
        </Animated.View>
      )}
    </ToastCtx.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, paddingVertical: 12, paddingHorizontal: 16, zIndex: 999, elevation: 10 },
  text: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
});
