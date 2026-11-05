import type { CartItem, Product } from './types';

export type CheckoutPayload =
  | { kind: 'cart'; items: CartItem[] }
  | { kind: 'buynow'; product: Product; quantity: number; size?: string | null };

let current: CheckoutPayload | null = null;
export const setCheckout = (p: CheckoutPayload | null) => {
  current = p;
};
export const getCheckout = () => current;
