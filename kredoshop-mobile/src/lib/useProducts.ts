import { useCallback, useEffect, useState } from 'react';
import { api, unwrap } from './api';
import type { Category, Product } from './types';

export function useCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [p, c] = await Promise.all([api.get('/products', false), api.get('/categories', false)]);
      setProducts(unwrap<Product[]>(p) || []);
      const seen = new Set<string>();
      setCategories((unwrap<Category[]>(c) || []).filter((x) => (seen.has(x.name) ? false : (seen.add(x.name), true))));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { products, categories, loading, error, reload: load };
}
