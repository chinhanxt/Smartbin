# HƯỚNG DẪN DÀNH CHO AI ASSISTANT & DEV 1 (NhanXt)
**Nhánh Git:** `dev-NhanXt`  
**Vai trò:** Developer 1 - Core IoT Telemetry, Traccar GPS Fleet Tracking & Station Offloading  
**Tài liệu tham chiếu:** [quy-trinh-thu-gom-iot-traccar-ai (1).pdf](file:///home/congnghiep/nghich/Smartbin/quy-trinh-thu-gom-iot-traccar-ai%20%281%29.pdf) (Trọng tâm: **Trang 01, 02, 04, 05**)  
**Quy tắc chung toàn team:** [TEAM_WORKFLOW_RULES.md](file:///home/congnghiep/nghich/Smartbin/TEAM_WORKFLOW_RULES.md)

---

> [!IMPORTANT]
> ### CHỈ THỊ BẮT BUỘC CHO TẤT CẢ AI ASSISTANT LÀM VIỆC TRÊN NHÁNH NÀY:
> 1. Bạn đang hỗ trợ **DEV 1 (NhanXt)** trên nhánh `dev-NhanXt`.
> 2. **CHỈ ĐƯỢC PHÉP** tạo mới và chỉnh sửa mã nguồn trong phạm vi thư mục được phân quyền cho Dev 1:
>    * `src/modules/fleet/` (Quản lý xe, lộ trình di chuyển, tài xế, trạm dỡ rác)
>    * `src/modules/iot-bins/` (Quản lý thùng rác thông minh, telemetry, trạng thái cảm biến)
>    * `src/store/fleet/` & `src/store/bins/` (Redux slices độc lập của Dev 1)
> 3. **TUYỆT ĐỐI KHÔNG ĐƯỢC CHẠM VÀO** các thư mục thuộc phạm vi của Dev 2 (`tickets/`, `dispatch/`, `routing/`) hoặc Dev 3 (`citizen/`, `billing/`, `bulky/`).
> 4. **TUYỆT ĐỐI KHÔNG SỬA TRỰC TIẾP** vào `src/Navigation.jsx` hay `src/store/index.js` để tránh gây xung đột Git (Merge Conflict) với Dev 2 và Dev 3. Hãy xuất route tại `src/modules/fleet/routes.jsx` và `src/modules/iot-bins/routes.jsx`.

---

## 1. MỤC TIÊU NGHIỆP VỤ CỦA DEV 1 (THEO PDF)

### Trang 01 & 02: Tiếp nhận & Tiền xử lý Dữ liệu IoT
- Lắng nghe sự kiện số đo từ cảm biến thùng rác: Mức đầy (%), cảnh báo mùi hôi, dung lượng pin, thời gian cập nhật.
- Lọc dữ liệu lỗi: Nếu cảm biến mất mạng, pin yếu hoặc số đo nhảy bất thường, gắn nhãn `Cần xác minh` (giữ nguyên cảnh báo mở, tạo yêu cầu kiểm tra thiết bị; **không được tự ý xóa cảnh báo**).
- Chuẩn hóa dữ liệu theo cấu trúc chuẩn để đẩy sang module Điều phối (Dev 2).

### Trang 03 & 04: Giám sát Đội xe Traccar GPS & Hiện trường
- Tích hợp Traccar GPS và WebSocket để hiển thị vị trí thời gian thực của xe rác trên bản đồ (sử dụng MapLibre GL sẵn có của hệ thống).
- Xử lý sự kiện Geofence: Phát hiện xe đi vào/đi ra khỏi vùng thu gom.
  * **Lưu ý nghiệp vụ sống còn (Trang 04):** Sự kiện xe vào geofence và thời gian dừng đỗ **chỉ là bằng chứng hỗ trợ**, **chưa đủ điều kiện để tự động đóng phiếu thu gom**.
- Ghi nhận sự cố hiện trường: Xe hỏng, ngõ tắc không tiếp cận được, mất sóng GPS (nghiệp vụ: mất GPS không được tự động quy kết tài xế bỏ việc).

### Trang 05: Bàn giao rác & Kết thúc chuyến (Offloading & Weighbridge)
- **Tách bạch 2 khái niệm:** Đóng phiếu tại điểm (thuộc Dev 2) $\neq$ Đóng chuyến xe (thuộc Dev 1).
- Theo dõi xe đến điểm bàn giao / bãi dỡ rác / trạm trung chuyển.
- **Quy tắc vàng (Trang 05):** Xe đến điểm bàn giao **chưa chứng minh đã dỡ rác**. Chỉ được cập nhật reset sức chứa xe sau khi có xác nhận **Phiếu cân** hoặc **Biên nhận bàn giao**.
- Tổng hợp đối soát chuyến xe: Thời gian, quãng đường di chuyển thực tế (theo Traccar), khối lượng rác đã giao.

---

## 2. RANH GIỚI FILE VÀ THƯ MỤC CỦA DEV 1

```
src/
├── modules/
│   ├── fleet/                   <-- [DEV 1 TOÀN QUYỀN]
│   │   ├── components/          # Bảng xe, trạng thái xe, giám sát nhiên liệu/GPS
│   │   ├── pages/               # FleetTrackingPage, TransferStationPage
│   │   ├── services/            # TraccarSocketService, VehicleApiService
│   │   └── routes.jsx           # Khai báo route riêng của Fleet
│   └── iot-bins/                <-- [DEV 1 TOÀN QUYỀN]
│       ├── components/          # Thẻ thùng rác, biểu đồ pin, cảnh báo mức đầy/mùi
│       ├── pages/               # BinMonitoringPage, SensorHealthPage
│       ├── services/            # BinTelemetryService
│       └── routes.jsx           # Khai báo route riêng của IoT Bins
├── store/
│   ├── fleet/                   <-- [DEV 1 TOÀN QUYỀN]
│   └── bins/                    <-- [DEV 1 TOÀN QUYỀN]
└── contracts/                   <-- [DÙNG CHUNG] Đọc interface tại đây
```

---

## 3. GIAO ƯỚC DỮ LIỆU CẦN CUNG CẤP CHO DEV 2 & DEV 3

Dev 1 có trách nhiệm cung cấp dữ liệu theo chuẩn sau:

### Trạng thái Thùng rác (Bin State):
```typescript
interface SmartBinTelemetry {
  binId: string;
  householdId: string;
  fillLevel: number; // 0 - 100%
  odorDetected: boolean;
  batteryLevel: number;
  lastUpdated: string; // ISO 8601
  status: 'ONLINE' | 'OFFLINE' | 'SENSOR_FAULT';
  latitude: number;
  longitude: number;
}
```

### Trạng thái Xe & Tải trọng (Vehicle State):
```typescript
interface WasteVehicleState {
  vehicleId: string;
  driverId: string;
  plateNumber: string;
  status: 'IDLE' | 'COLLECTING' | 'AT_TRANSFER_STATION' | 'MAINTENANCE';
  currentWeightKg: number;
  maxWeightKg: number;
  latitude: number;
  longitude: number;
  speedKmH: number;
  isGpsLost: boolean;
  lastReceiptId?: string; // Mã phiếu cân xác nhận dỡ rác
}
```

---

## 4. QUY TRÌNH LÀM VIỆC TRÊN NHÁNH `dev-NhanXt`

Trước khi bắt đầu code mỗi ngày hoặc trước khi chuẩn bị tạo Pull Request:
```bash
# 1. Cập nhật mã nguồn mới nhất từ nhánh main
git fetch origin
git rebase origin/main

# 2. Kiểm tra code style và build
npm run lint
npm run build

# 3. Đẩy lên nhánh remote
git push origin dev-NhanXt
```

> Hãy tuân thủ nghiêm ngặt ranh giới thư mục để đảm bảo khi tạo PR vào `main`, lệnh merge sẽ diễn ra tự động 100% không có bất kỳ conflict nào!
