# SmartBin Citizen Service — Cổng Dân Cư & Dịch Vụ Thu Phí Môi Trường

Microservice độc lập dành cho Người dân / Hộ gia đình trong hệ sinh thái SmartBin IoT:
- Quản lý thông tin hộ gia đình & liên kết thẻ định danh thùng rác (RFID / LoRaWAN).
- Giám sát trạng thái thùng rác thông minh (Mức đầy %, cảnh báo mùi, pin mặt trời).
- Theo dõi lịch thu gom & định vị xe thu gom thời gian thực (Traccar GPS & Radar khoảng cách).
- Gửi phản ánh chất lượng thu gom và theo dõi tiến trình 4 bước.
- Xem bảng kê hóa đơn phí dịch vụ môi trường định kỳ hàng tháng.
- Thanh toán trực tuyến (MoMo, VietQR, ZaloPay) & ủy quyền trích tiền tự động.
- Đối soát lịch sử giao dịch và biên lai số.
- Tiếp nhận thông báo nhắc nợ theo chu kỳ.
- Gửi yêu cầu gia hạn / khôi phục dịch vụ trực tuyến.

---

## 🚀 Khởi Chạy Nhanh (Local Development)

```bash
# Cài đặt dependencies
npm install

# Chạy máy chủ phát triển
npm run dev
# Mặc định mở tại: http://localhost:3002
```

## 🐳 Chạy Bằng Docker Container

```bash
# Build Docker image
docker build -t smartbin-citizen-service:latest .

# Chạy container độc lập
docker run -d --name smartbin-citizen -p 3002:80 smartbin-citizen-service:latest

# Kiểm tra Healthcheck
curl http://localhost:3002/healthz
```

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Microservice Runtime**: Nginx Alpine với SPA routing, Gzip, IPv4/IPv6 dual-stack.
- **Design System**: Chuẩn thiết kế đô thị tối giản, tuân thủ `DESIGN.md` và nguyên tắc Anti-Slop AI.
