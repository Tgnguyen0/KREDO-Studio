// Đặt EXPO_PUBLIC_API_URL trong file .env (xem .env.example).
// Lưu ý: khi chạy trên điện thoại thật KHÔNG dùng localhost, hãy dùng IP LAN của máy chạy backend
// (vd http://192.168.1.10:8080) hoặc URL ngrok/HTTPS.
export const API_URL: string = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export const SEPAY_BANK = { acc: '107876577018', bank: 'VietinBank', holder: 'KREDO STUDIO' };
export const FREE_SHIP_MIN = 1_000_000;
export const SHIP_FEE = 30_000;
