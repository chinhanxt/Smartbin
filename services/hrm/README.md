# SmartBin HRM Service — Quản Lý Nhân Sự, Ca Kíp & Điều Phối Tuyến Thu Gom

Microservice chuyên biệt dành cho Bộ phận Nhân sự, Đội xe và Ban Điều phối Vận hành:
- **Bản đồ giao thông đô thị (Google Maps canvas)**: Theo dõi lộ trình các tuyến xe gom (Tuyến 01 - 04), trạm trung chuyển, depot và định vị xe thực tế.
- **Quản lý Hồ sơ Nhân sự & Lái xe**: Hồ sơ công nhân, bằng lái hạng C/D/E, chứng chỉ an toàn lao động, giấy khám sức khỏe và hợp đồng.
- **Phân ca & Lập lịch làm việc**: Phân bổ ca sáng, ca chiều, ca đêm; hoán đổi ca và ghi nhận làm thêm giờ (OT).
- **Chấm công & Điểm danh định vị**: Chấm công GPS tại depot/điểm tập kết, theo dõi tỷ lệ chuyên cần thời gian thực.
- **Bảng lương & Quyết toán thu nhập**: Tính lương cơ bản, phụ cấp độc hại, thưởng khối lượng rác thu gom và xuất phiếu lương.
- **Xác thực & Phân quyền đa vai trò**: Đăng nhập/đăng xuất độc lập cho Admin Quản lý và Tài xế / Nhân viên hiện trường.

---

## 🚀 Khởi Chạy Nhanh (Local Development)

```bash
# Cài đặt dependencies
npm install

# Chạy máy chủ phát triển
npm run dev
# Mặc định mở tại: http://localhost:3004
```

## 🐳 Chạy Bằng Docker Container

```bash
# Build Docker image
docker build -t smartbin-hrm-service:latest .

# Chạy container độc lập
docker run -d --name smartbin-hrm -p 3004:80 smartbin-hrm-service:latest

# Kiểm tra Healthcheck
curl http://localhost:3004/healthz
```

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Microservice Runtime**: Nginx Alpine với SPA routing, Gzip, IPv4/IPv6 dual-stack.
- **Design System**: Chuẩn thiết kế đô thị tối giản, tuân thủ `DESIGN.md` và nguyên tắc Anti-Slop AI.
