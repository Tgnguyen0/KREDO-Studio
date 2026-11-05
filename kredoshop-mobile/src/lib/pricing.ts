import type { Product } from './types';

export function getPrices(p: Product) {
  const d = p.discountAmount ?? 0;
  if (d > 0) {
    const original = d > 100 ? p.price + d : undefined;
    const pct = d > 100 ? Math.round((d / (p.price + d)) * 100) : Math.round(d);
    return { current: p.costPrice || p.price, original, pct };
  }
  return { current: p.costPrice || p.price, original: undefined, pct: 0 };
}

export function mergeSizes(p: Product) {
  const map = new Map<string, { id: number; sizeName: string; quantity: number }>();
  p.sizeDetails?.forEach((s) => {
    const e = map.get(s.sizeName);
    if (e) e.quantity += s.quantity;
    else map.set(s.sizeName, { ...s });
  });
  const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];
  return [...map.values()].sort((a, b) => {
    const ia = order.indexOf(a.sizeName.toUpperCase());
    const ib = order.indexOf(b.sizeName.toUpperCase());
    if (ia === -1 && ib === -1) return a.sizeName.localeCompare(b.sizeName, undefined, { numeric: true });
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

export const isSoldOut = (p: Product) =>
  p.sizeDetails && p.sizeDetails.length > 0 ? p.sizeDetails.every((s) => s.quantity <= 0) : p.quantity === 0;
