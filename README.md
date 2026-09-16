# Smartbin Mobile - GPS Tracker Microservice

> **Microservice độc lập** đóng vai trò Client phát tín hiệu GPS và Telemetry từ điện thoại di động về hệ thống trung tâm Smartbin (tương tự Traccar Client APK nhưng chạy trên nền tảng Web / PWA đa nền tảng).

---

## 🌟 Tính Năng Chính
1. **Tự động nhận diện thiết bị theo IP mạng**: Không cần sinh mã ngẫu nhiên hay cấu hình thủ công.
2. **Tự động kết nối & truyền dữ liệu**: Khi người dùng cấp quyền vị trí, hệ thống lập tức hiển thị `✓ Đã kết nối` và truyền toạ độ thời gian thực về máy chủ.
3. **Theo dõi mức pin thông minh**:
   - **Android**: Tự động đọc pin phần cứng và nhận biết cắm/rút sạc qua Web Battery API.
   - **iOS Safari / WebKit**: Cung cấp cửa sổ chọn nhanh mức pin (với nút bấm 1 chạm `43%`, `50%`, `80%`...) do Apple chặn đọc pin vì chính sách riêng tư. Mô phỏng tiêu hao tự nhiên (-1% mỗi 3 phút).
4. **Phát tín hiệu SOS khẩn cấp**: Kèm hiệu ứng rung và âm thanh báo động ưu tiên cao về trung tâm điều phối.
5. **Cài đặt linh hoạt**: Tùy chỉnh URL máy chủ nhận tin và tần suất gửi (giây).
6. **Nhật ký truyền tin**: Xem trực tiếp lịch sử các gói tin toạ độ đã phát thành công.

---

## 🚀 Khởi Chạy

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Chạy môi trường phát triển (Dev Server)
```bash
npm run dev
# Mặc định chạy tại http://localhost:3001
```

### 3. Build sản xuất
```bash
npm run build
```

---

## 📡 Cấu Trúc Microservice
- **Port:** 3001
- **Giao thức truyền tin:** HTTP GET OsmAnd Protocol (`/gps?id={IP}&lat={lat}&lon={lon}&batt={pin}&charge={sac}`)
- **Độc lập hoàn toàn** với Web quản trị giám sát (`traccar-web`).
