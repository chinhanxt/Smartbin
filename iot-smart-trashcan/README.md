# 🗑️ Smart Waste Bin IoT - 3D Simulation Microservice

Ứng dụng Web 3D mô phỏng hệ thống **Thùng rác thông minh IoT (Smart Waste Bin)** được đóng gói hoàn chỉnh dưới dạng một **Microservice** (Micro-Frontend Widget) bằng **Docker**, sẵn sàng nhúng vào bất kỳ ứng dụng Web cha nào (React, Vue, Next.js, Django, Laravel, Spring Boot hoặc HTML thuần).

Hệ thống tích hợp mô phỏng động cơ Servo mở nắp, cảm biến siêu âm phát hiện mức đầy, cảm biến mùi hôi, giám sát pin, thuật toán phát hiện bất thường & mất tín hiệu với chốt an toàn **CẦN XÁC MINH (SENSOR_FAULT)** không tự ý xóa cảnh báo.

---

## 🌟 Tính năng Nổi bật

* **Đồ họa 3D Chân thực (Three.js r170)**: 
  * Tích hợp đầy đủ 3 mô hình 3D thực tế: **Sci-Fi Smart Trash Can**, **Plastic Water Bottle**, và **Garbage Bag** (Túi rác sinh hoạt).
  * Phong cách thiết kế **Clean White Studio** hiện đại, ánh sáng mềm, sàn đổ bóng kỹ thuật cao.
* **Mô phỏng Vật lý Thực tế (Cannon-es)**:
  * Rác rơi tự do, va chạm, lật xoay và xếp chồng tự nhiên.
  * Tường chắn collider đa diện khép kín chống tràn/lọt vật thể ra ngoài.
* **Lắng nghe & Xử lý Telemetry IoT Chuẩn hóa**:
  * **Mức đầy (`fillLevel` %)**: Đo đạc khoảng cách thực tế từ cảm biến siêu âm trên nắp thùng.
  * **Nồng độ mùi hôi (`odorDetected` boolean)**: Tự động cảnh báo khi có túi rác hữu cơ hoặc lượng rác lớn.
  * **Dung lượng pin (`batteryLevel` %)**: Giám sát mức pin dự phòng, cảnh báo khi $\le 15\%$.
  * **Thời gian cập nhật (`updatedAt`)**: Ghi nhận mốc thời gian viễn thám thực tế.
* **Quy tắc Xử lý Lỗi & Chốt An toàn Bất biến (SENSOR_FAULT)**:
  * Tự động phát hiện và gắn cờ **Cần xác minh (`SENSOR_FAULT`)** khi:
    1. Cảm biến mất tín hiệu (heartbeat timeout > 6s).
    2. Pin yếu ($\le 15\%$).
    3. Dữ liệu nhảy bất thường ($\Delta \ge 40\%$ không qua ném rác hoặc giá trị không hợp lệ).
  * **Tuyệt đối không tự ý xóa hoặc hủy bỏ cảnh báo**: Cảnh báo chỉ được gỡ bỏ khi kỹ thuật viên/người điều hành chủ động bấm **Xác minh sự cố** (`VERIFY_FAULT`).
* **Menu Thử nghiệm Độc lập Trên Màn hình**:
  * Đặt gọn ở góc phải, mặc định thu gọn (`collapsed`).
  * Sử dụng toàn bộ icon chuẩn SVG.
  * Bật/tắt độc lập các lỗi giả lập với phản hồi trực quan tức thì trên HUD.

---

## 🚀 Khởi chạy Nhanh

### Cách 1: Chạy bằng Docker Compose (Khuyên dùng)
```bash
# Build và khởi chạy container chạy ngầm
docker compose up -d --build

# Xem log hoạt động
docker compose logs -f

# Kiểm tra trạng thái health check
docker compose ps
```
Ứng dụng sẽ khả dụng ngay tại:
* 🌐 **Web 3D App**: `http://localhost:8080`
* 🩺 **Health Check**: `http://localhost:8080/health` (`200 OK: healthy`)

### Cách 2: Chạy môi trường Phát triển cục bộ (Node.js)
```bash
# Cài đặt thư viện
npm install

# Khởi chạy Vite Dev Server
npm run dev

# Chạy bộ test tự động (74 unit tests kiểm thử logic fault & invariant)
npm test

# Đóng gói bản production
npm run build
```

---

## 🔌 Tích hợp vào Web khác (Microservice Iframe)

### 1. Nhúng HTML Iframe
Microservice đã được cấu hình Nginx mở `frame-ancestors *` và CORS `*`:
```html
<iframe 
  id="smart-bin-frame"
  src="http://localhost:8080?notest=1" 
  width="100%" 
  height="700px" 
  frameborder="0"
  style="border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.06); border: none;">
</iframe>
```

### 2. Các tham số URL linh hoạt (Query Parameters)
| Tham số | Giá trị | Tác dụng |
| :--- | :--- | :--- |
| `embed=1` | `1` | Ẩn thanh 4 nút điều khiển dưới đáy và ẩn menu test (chỉ hiển thị 3D & HUD). |
| `notest=1` | `1` | Ẩn menu thử nghiệm bên phải khi triển khai cho người dùng cuối. |
| `nohud=1` | `1` | Ẩn toàn bộ thẻ thông số HUD, chỉ hiển thị duy nhất không gian 3D. |
| `bg=transparent` | `transparent` | Làm nền canvas trong suốt để hòa vào theme của web cha. |

---

## 📡 Giao tiếp Hai chiều (postMessage API)

Web cha có thể gửi lệnh điều khiển và nhận dữ liệu viễn thám trực tiếp từ microservice qua trình duyệt:

### A. Web cha lắng nghe Telemetry từ Thùng Rác
```javascript
window.addEventListener('message', (event) => {
  const { type, telemetry, status, faultReasons } = event.data || {};
  
  if (type === 'SMART_BIN_TELEMETRY') {
    console.log('Telemetry nhận được:', {
      fillLevel: telemetry.fillLevel,       // 0 - 100%
      odorDetected: telemetry.odorDetected, // true / false
      batteryLevel: telemetry.batteryLevel, // 0 - 100%
      updatedAt: telemetry.updatedAt,       // 'HH:mm:ss'
      status: status,                       // 'NORMAL' | 'CAUTION' | 'CRITICAL_FULL' | 'SENSOR_FAULT'
      faultReasons: faultReasons            // e.g. ['PIN_YẾU', 'MẤT_TÍN_HIỆU']
    });
  }
});
```

### B. Web cha gửi lệnh điều khiển tới Thùng Rác
```javascript
const iframeWin = document.getElementById('smart-bin-frame').contentWindow;

// 1. Ném 1 chai nước
iframeWin.postMessage({ type: 'DROP_BOTTLE' }, '*');

// 2. Ném 1 túi rác
iframeWin.postMessage({ type: 'DROP_BAG' }, '*');

// 3. Làm rỗng thùng rác
iframeWin.postMessage({ type: 'RESET_BIN' }, '*');

// 4. Bơm dữ liệu cảm biến thực tế từ backend IoT của bạn
iframeWin.postMessage({
  type: 'INJECT_TELEMETRY',
  data: {
    fillLevel: 68,
    odorDetected: true,
    batteryLevel: 85,
    updatedAt: '04:15:00'
  }
}, '*');

// 5. Xác minh và gỡ chốt sự cố (khi kỹ thuật viên xử lý xong)
iframeWin.postMessage({ type: 'VERIFY_FAULT' }, '*');
```

---

## 📁 Cấu trúc Thư mục Dự án

```
iot-smart-trashcan/
├── Dockerfile                # Multi-stage Docker build (Node.js 20 -> Nginx Alpine)
├── docker-compose.yml        # Docker Compose service cấu hình port & healthcheck
├── nginx.conf                # Nginx CORS, CSP frame-ancestors, GZIP, MIME types
├── package.json              # Quản lý dependencies (Three.js, Cannon-es, Vite)
├── test_sensor_fault.js      # Bộ kiểm thử 74 unit tests cho quy tắc chốt lỗi bất biến
├── index.html                # Cấu trúc giao diện HTML, SVG Icons, HUD & Test Panel
├── public/
│   └── models/               # 3D GLTF / GLB assets
│       ├── sci_fi_trash_can.glb
│       ├── plastic_water_bottle.glb
│       └── garbage_bag.glb
└── src/
    ├── config.js             # Cấu hình ngưỡng IoT, kích thước vật lý, thông số cảm biến
    ├── main.js               # Điểm khởi chạy chính, Microservice Bridge, Test Panel UI
    ├── style.css             # Thiết kế Clean White Studio & Glassmorphism responsive
    ├── iot/
    │   ├── SensorManager.js  # Lõi tính toán Telemetry, Fault Detection & Latching Invariant
    │   ├── MqttSimulator.js  # Bộ phát giả lập bản tin viễn thám thời gian thực
    │   └── SoundAlert.js     # Web Audio API tạo âm thanh servo mở nắp & còi báo động
    ├── models/
    │   ├── TrashCanModel.js  # Nạp & điều khiển nắp thùng rác / LED cảnh báo
    │   ├── BottleModel.js    # Nạp & clone chai nước 3D
    │   └── GarbageBagModel.js# Nạp & clone túi rác 3D
    ├── physics/
    │   ├── PhysicsWorld.js   # Động cơ vật lý Cannon-es với collider khép kín
    │   └── BottleSpawner.js  # Quản lý vòng đời spawn & sync tọa độ rác
    └── ui/
        ├── DashboardHUD.js    # Cập nhật thông số trực quan, đồng hồ đo, chip trạng thái
        └── Controls.js        # Lắng nghe các nút tương tác đáy màn hình
```

---

## 📄 Tài liệu Tích hợp Chi tiết
Để xem hướng dẫn tích hợp chi tiết cùng mã nguồn mẫu cho React, Vue, và REST/WebSocket, vui lòng xem [`MICROSERVICE.md`](./MICROSERVICE.md).
