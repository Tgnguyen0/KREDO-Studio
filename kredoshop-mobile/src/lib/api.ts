import * as SecureStore from 'expo-secure-store';
import { API_URL } from './config';

const TOKEN_KEY = 'accessToken';
let memToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const tokenStore = {
  async load() {
    try {
      memToken = await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      memToken = null;
    }
    return memToken;
  },
  async set(t: string) {
    memToken = t;
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, t);
    } catch {}
  },
  async clear() {
    memToken = null;
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {}
  },
  get: () => memToken,
};

export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T = any>(method: string, path: string, body?: unknown, auth = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth && memToken) headers.Authorization = `Bearer ${memToken}`;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Không thể kết nối máy chủ. Kiểm tra mạng hoặc EXPO_PUBLIC_API_URL.', 0);
  }
  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    if (res.status === 401 && auth && memToken) onUnauthorized?.();
    throw new ApiError((data && (data.message || data.result)) || `Lỗi ${res.status}`, res.status);
  }
  return data as T;
}

export const api = {
  get: <T = any>(p: string, auth = true) => request<T>('GET', p, undefined, auth),
  post: <T = any>(p: string, b?: unknown, auth = true) => request<T>('POST', p, b ?? {}, auth),
  put: <T = any>(p: string, b?: unknown) => request<T>('PUT', p, b ?? {}),
  del: <T = any>(p: string) => request<T>('DELETE', p),
};

export const unwrap = <T = any>(d: any): T => (d && typeof d === 'object' && 'result' in d ? d.result : d) as T;
