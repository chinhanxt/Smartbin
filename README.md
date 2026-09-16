# SmartBin Admin Billing Service — Trung Tâm Quản Trị Hóa Đơn & Thu Phí Định Kỳ

Microservice chuyên biệt dành cho Cán bộ Quản lý Tài chính & Đơn vị Thu gom rác thải đô thị:
- **Sơ đồ đô thị tương tác**: Giám sát phân bổ doanh thu, trạng thái nộp phí và khu vực thu gom theo bản đồ quy hoạch.
- **Tạo hóa đơn định kỳ tự động**: Lập kỳ phí tháng cho từng hộ dân theo hạn ngạch và đơn giá quy định.
- **Quản lý thanh toán & Trích tiền tự động**: Giám sát ủy quyền trích nợ qua ngân hàng/ví điện tử, tra cứu giao dịch.
- **Đối soát thanh toán đa cổng**: Đối chiếu mã tham chiếu ngân hàng, cảnh báo trùng lặp giao dịch và chốt sổ kỳ thu.
- **Cảnh báo quá hạn & Nhắc nợ tự động**: Thiết lập quy tắc dunning nhiều mốc (D, D+3, D+7, D+14) qua Zalo ZNS / SMS.
- **Quản lý Tạm ngừng & Khôi phục dịch vụ**: Hội đồng xét duyệt chính sách an sinh, điều chỉnh danh sách thu gom thực địa.

---

## 🚀 Khởi Chạy Nhanh (Local Development)

```bash
# Cài đặt dependencies
npm install

# Chạy máy chủ phát triển
npm run dev
# Mặc định mở tại: http://localhost:3003
```

## 🐳 Chạy Bằng Docker Container

```bash
# Build Docker image
docker build -t smartbin-admin-billing-service:latest .

# Chạy container độc lập
docker run -d --name smartbin-billing -p 3003:80 smartbin-admin-billing-service:latest

# Kiểm tra Healthcheck
curl http://localhost:3003/healthz
```

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Microservice Runtime**: Nginx Alpine với SPA routing, Gzip, IPv4/IPv6 dual-stack.
- **Design System**: Chuẩn thiết kế đô thị tối giản, tuân thủ `DESIGN.md` và nguyên tắc Anti-Slop AI.
