# KREDO Studio – Mobile (React Native + Expo)

Bản mobile của `kredoshop-fe`, dùng chung backend Spring Boot.

## Chạy thử
```bash
npm install
cp .env.example .env     # sửa EXPO_PUBLIC_API_URL thành IP LAN của máy chạy backend
npx expo start           # quét QR bằng Expo Go
```
Điện thoại và máy chạy backend phải cùng mạng Wi-Fi. Không dùng `localhost` trên điện thoại thật.

## Màn hình
Tab: Trang chủ · Sản phẩm · Yêu thích · Giỏ hàng · Tài khoản
Stack: Chi tiết sản phẩm, Đăng nhập, Đăng ký, Quên mật khẩu (OTP), Thanh toán, QR chuyển khoản, Đơn hàng, Hồ sơ & địa chỉ, Về KREDO, Chính sách.

Admin/Staff không có trên mobile (dùng bản web).
