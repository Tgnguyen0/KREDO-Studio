import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { api, setUnauthorizedHandler, tokenStore, unwrap } from './api';
import type { CartItem, User } from './types';

type AuthCtx = {
  ready: boolean;
  user: User | null;
  cartId: number | null;
  cartCount: number;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshCart: () => Promise<void>;
};
const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);
export const useAuth = () => useContext(Ctx);

function decodeScope(token: string): string | undefined {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(part)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    const p = JSON.parse(json);
    return p.scope || p.role || p.authorities?.[0];
  } catch {
    return undefined;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [cartId, setCartId] = useState<number | null>(null);
  const [cartCount, setCartCount] = useState(0);

  const loadCart = useCallback(async (u: User | null) => {
    if (!u) {
      setCartId(null);
      setCartCount(0);
      return;
    }
    try {
      const cart = unwrap<{ id: number }>(await api.get(`/carts/account/${u.id}`));
      setCartId(cart.id);
      const raw = await api.get(`/cart-details/cart/${cart.id}`);
      const items: CartItem[] = Array.isArray(raw) ? raw : raw?.result || [];
      setCartCount(items.reduce((s, i) => s + (i.quantity || 0), 0));
    } catch {}
  }, []);

  const clear = useCallback(async () => {
    await tokenStore.clear();
    setUser(null);
    setCartId(null);
    setCartCount(0);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clear();
    });
    (async () => {
      const t = await tokenStore.load();
      if (t) {
        try {
          const u = unwrap<User>(await api.get('/accounts/myinfor'));
          setUser(u);
          await loadCart(u);
        } catch {
          await clear();
        }
      }
      setReady(true);
    })();
  }, [clear, loadCart]);

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await api.post('/auth/login', { username, password }, false);
      const token: string | undefined = res?.result?.token;
      if (!token) throw new Error('Không nhận được mã xác thực.');
      const scope = decodeScope(token);
      if (scope && scope !== 'USER') {
        throw new Error('Tài khoản quản trị/nhân viên vui lòng dùng bản web. Ứng dụng này dành cho khách hàng.');
      }
      await tokenStore.set(token);
      const u = unwrap<User>(await api.get('/accounts/myinfor'));
      setUser(u);
      await loadCart(u);
    },
    [loadCart],
  );

  const logout = useCallback(async () => {
    await clear();
    router.replace('/');
  }, [clear]);

  const refreshCart = useCallback(() => loadCart(user), [loadCart, user]);

  const value = useMemo(
    () => ({ ready, user, cartId, cartCount, login, logout, refreshCart }),
    [ready, user, cartId, cartCount, login, logout, refreshCart],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
