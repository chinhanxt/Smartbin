# Smartbin Citizen Management Microservice (`smartbin-citizen-service`)

> **Microservice Cổng Thông Tin & Quản Lý Rác Thông Minh Dành Cho Cư Dân (Nhóm 1 — Người Dân)**  
> Tuân thủ 100% tài liệu phong cách thiết kế **`DESIGN.md`** (HUTECH Program Frontend Design System).

---

## 1. Tổng Quan Kiến Trúc & Vai Trò Hệ Thống

`smartbin-citizen-service` là một Microservice độc lập phục vụ cư dân đô thị và các hộ gia đình trong hệ sinh thái **Smartbin V2.5** (Realtime GPS & IoT Waste Management System).

| Thuộc tính | Chi tiết |
|---|---|
| **Tên dịch vụ** | `smartbin-citizen-service` |
| **Cổng mặc định** | `3002` (Dev & Docker Nginx Container) |
| **Công nghệ** | React 18 / TypeScript, Vite, Tailwind CSS v3/v4, Lucide Icons |
| **Phong cách UI** | **`DESIGN.md` (HUTECH Program Frontend)** |
| **Kiến trúc** | SPA Microservice độc lập, sẵn sàng đóng gói Docker / Kubernetes |

---

## 2. Bản Đồ 4 Chức Năng Cốt Lõi (Nhóm 1 — Người Dân)

Dịch vụ hiện thực hóa đầy đủ 4 chức năng cốt lõi theo đúng yêu cầu nghiệp vụ:

```
+-----------------------------------------------------------------------------------------+
|                    SMARTBIN CITIZEN MANAGEMENT MICROSERVICE (Port 3002)                 |
+-----------------------------------------------------------------------------------------+
       |                               |                                |               |
       v                               v                                v               v
[1. Hộ Dân & Thùng Rác]     [2. Tình Trạng IoT]            [3. Lịch & Xe GPS]   [4. Phản Ánh Dịch Vụ]
• Hồ sơ định danh hộ dân    • Mức đầy 0-100% (Thước đo 3D) • Lịch tuần phân loại• Gửi báo bỏ sót rác
• Liên kết mã BIN-IOT-XXXX  • Cảnh báo mùi NH₃ / H₂S (ppm) • Trực tiếp GPS xe  • Rơi vãi / Thùng hỏng
• Thẻ QR Code dán thùng     • Dung lượng pin quang năng    • Radar khoảng cách  • Vòng đời 4 bước
• Xác thực RFID / LoRaWAN   • Cập nhật số đo tức thì (Ping)• Ước tính giờ đến   • Đánh giá hài lòng
```

### Chi tiết nghiệp vụ từng chức năng:

### 1. Quản lý hộ gia đình và thùng rác riêng
- **Mục tiêu:** Liên kết tài khoản, địa chỉ cư trú và thiết bị IoT thùng rác với đúng hộ dân.
- **Tính năng triển khai:**
  - Thẻ danh thiếp hộ dân: Mã hộ (`HGD-TPTD-09218`), Chủ hộ, CCCD, Số điện thoại, Địa chỉ chi tiết.
  - Thông số thiết bị thùng rác: Mã thiết bị (`BIN-IOT-7749`), Model, Dung tích (120L), Thẻ RFID nhận diện xe, LoRa DevEUI, Địa chỉ MAC, Phiên bản firmware.
  - Modal **Liên kết thiết bị mới**: Cho phép hộ dân tự quét mã QR hoặc nhập mã thiết bị thay thế khi đổi thùng.
  - Modal **Thẻ QR Code dán thùng**: Tạo mã QR định danh kèm nút tải về để dán lên nắp thùng rác cho công nhân quét kiểm tra.

### 2. Xem tình trạng thùng rác IoT
- **Mục tiêu:** Mức đầy, cảnh báo nguy cơ mùi và thời điểm cập nhật dữ liệu viễn thám.
- **Tính năng triển khai:**
  - **Mức đầy (Fill Level %):** Hiển thị trực quan theo 3 dải màu cảnh báo môi trường:
    - `< 50%`: Xanh lục (Bình thường).
    - `50% - 79%`: Vàng hổ phách (Cảnh báo sắp đầy).
    - `≥ 80%`: Đỏ rực (Đầy khẩn cấp — kích hoạt cảnh báo gom rác).
  - **Cảnh báo nguy cơ mùi:** Cảm biến khí NH₃ (Amoniac) và H₂S (Lên men hữu cơ) tính theo đơn vị `ppm` kèm khuyến cáo tự động.
  - **Năng lượng & Vi khí hậu:** Dung lượng pin năng lượng mặt trời (%), nhiệt độ thùng (°C), độ ẩm (%), số lần mở nắp trong ngày.
  - **Thời điểm cập nhật:** Hiển thị thời gian đồng bộ dạng tương đối ("3 phút trước") và dấu thời gian ISO chuẩn.
  - **Nút "Lấy số đo tức thì" (Ping sensor):** Gửi lệnh kiểm tra heartbeat tới gateway.
  - **Thanh trượt thử nghiệm (Simulator):** Cho phép người dùng trực tiếp kiểm tra phản ứng giao diện theo các mức rác 0-100%.

### 3. Theo dõi lịch thu gom & Xe rác Traccar GPS
- **Mục tiêu:** Xem lịch, trạng thái phục vụ và giờ xe đến dự kiến (ETA) khi có dữ liệu vệ tinh.
- **Tính năng triển khai:**
  - **Live Radar & GPS Truck Tracker:**
    - Định vị xe thu gom số hiệu `XE-04 (Biển số: 59C-882.14)` do tài xế phụ trách.
    - Khoảng cách thời gian thực: `Cách điểm thu gom 420m` (vận tốc 18.5 km/h).
    - Giờ xe đến dự kiến (ETA): Đếm lùi `~ 11 phút`.
    - Radar Visualizer: Vòng sóng radar phát xung đồng tâm, vệt đường di chuyển và điểm đến thùng rác hộ dân.
  - **Lịch thu gom định kỳ trong tuần:** Bảng lịch phân chia rác hữu cơ, rác tái chế và trạng thái phục vụ từng ngày (`Sắp diễn ra`, `Xe đang đến`, `Đã thu gom`).
  - Nút **"Nhắc Tôi Khi Xe Sắp Đến"**: Bật chuông thông báo đẩy trước 15 phút.

### 4. Gửi và theo dõi phản ánh chất lượng
- **Mục tiêu:** Báo bỏ sót rác, chưa thu sạch hoặc vấn đề dịch vụ; theo dõi kết quả xử lý minh bạch.
- **Tính năng triển khai:**
  - **Form gửi phản ánh:** Phân loại theo 6 nhóm lỗi (Bỏ sót rác, Rơi vãi nước rỉ rác, Thùng hỏng, Thu gom sai giờ...), tiêu đề, mô tả, ảnh hiện trường đính kèm.
  - **Vòng đời xử lý 4 bước trực quan:**
    `1. Đã tiếp nhận` $\rightarrow$ `2. Kiểm tra GPS xe rác` $\rightarrow$ `3. Điều xe xử lý bổ sung` $\rightarrow$ `4. Nghiệm thu xong`.
  - **Phản hồi từ Thanh tra Môi trường:** Ghi chú giải trình nguyên nhân (xe bị vướng đường hẻm, xe xây dựng chắn lối...) và biện pháp khắc phục.
  - **Đánh giá hài lòng (1 - 5 sao):** Cho phép người dân chấm điểm sau khi sự việc được giải quyết.

---

## 3. Tuân Thủ Phong Cách Thiết Kế `DESIGN.md`

Giao diện áp dụng chính xác 100% token và quy ước từ tài liệu:

| Thành phần | Token áp dụng | Giá trị cụ thể |
|---|---|---|
| **Màu thương hiệu** | Header Title | `#004b93` (HUTECH / Civic Deep Navy) |
| **Màu hành động chính** | `bg-primary`, `text-primary` | `#1d4ed8` (Blue-700) |
| **Nền toàn trang** | `bg-background` | `#f8fafc` (Slate-50) |
| **Chữ chính** | `text-foreground` | `#020817` (~Slate-950) |
| **Nền card & modal** | `bg-card` | `#ffffff` |
| **Chữ phụ, mô tả** | `text-muted-foreground` | `#64748b` (Slate-500) |
| **Viền mặc định** | `border-border` | `#e2e8f0` (Slate-200) |
| **Status Badge** | `bg-*-50 text-*-700 ring-*-200` | Pill badge theo §8 DESIGN.md |
| **AppShell Layout** | Sidebar `w-64` / `w-16` | Thu gọn mượt mà kèm icon lucide §4 |
| **Form Inputs** | `.form-input` | Bo góc `rounded-lg`, ring `ring-primary` §10 |

---

## 4. Hướng Dẫn Cài Đặt & Chạy Dịch Vụ

### Cách 1: Chạy Môi Trường Phát Triển (Local Dev)
```bash
cd /home/chinhan/smartbin-citizen-service
npm install
npm run dev
```
Truy cập trình duyệt: 👉 **`http://localhost:3002`**

### Cách 2: Build Bản Triển Khai Sản Phẩm
```bash
npm run build
npm run preview
```

### Cách 3: Chạy Bằng Docker / Docker-Compose
```bash
cd /home/chinhan/smartbin-citizen-service
docker compose up -d --build
```
Dịch vụ sẽ khởi chạy qua Nginx container tại port `3002`.
