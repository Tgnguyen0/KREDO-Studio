export const formatVND = (n?: number | null) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    typeof n === 'number' && isFinite(n) ? n : 0,
  );

export const formatDate = (s?: string) => {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  const p = (x: number) => String(x).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const toDateInput = (v?: string | null) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
