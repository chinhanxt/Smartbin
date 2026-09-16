# 🚀 Smart Waste Bin IoT 3D - Microservice Integration Guide

Tài liệu hướng dẫn triển khai và tích hợp ứng dụng mô phỏng 3D Thùng Rác Thông Minh IoT dưới dạng một **Microservice** (Micro-Frontend Widget) độc lập được đóng gói bằng **Docker**, sẵn sàng nhúng và giao tiếp hai chiều với bất kỳ hệ thống Web cha nào (React, Vue, Angular, Next.js, Django, Laravel hoặc HTML thuần).

---

## 1. 📦 Chạy với Docker & Docker Compose

### Khởi chạy bằng Docker Compose (Khuyên dùng)
```bash
# Khởi chạy và tự động build image
docker compose up -d --build

# Xem log hoạt động
docker compose logs -f

# Kiểm tra trạng thái health check
docker compose ps

# Dừng container
docker compose down
```

### Hoặc chạy trực tiếp bằng Docker CLI
```bash
# Build image
docker build -t smart-trashcan-3d:latest .

# Run container (ánh xạ cổng 8080 máy host vào cổng 80 container)
docker run -d --name smart-trashcan-service -p 8080:80 smart-trashcan-3d:latest
```

Sau khi chạy, microservice sẽ khả dụng tại:
* 🌐 **Ứng dụng 3D**: `http://localhost:8080`
* 🩺 **Health Check**: `http://localhost:8080/health` (trả về `200 OK: healthy`)

Kiểm tra nhanh endpoint health check bằng curl:
```bash
curl -i http://localhost:8080/health
```

---

## 2. 🔌 Cách nhúng vào Website khác (Iframe Embedding)

Microservice đã được cấu hình sẵn Nginx với:
- `Content-Security-Policy: frame-ancestors *;` (cho phép nhúng vào mọi domain cha mà không bị chặn `X-Frame-Options`).
- `Access-Control-Allow-Origin: *` (hỗ trợ CORS cho toàn bộ asset, texture và file GLB).
- `GZIP` tối ưu hóa cho file 3D `.glb` và JavaScript bundle.

### Code HTML cơ bản để nhúng:
```html
<iframe 
  id="smart-bin-widget"
  src="http://localhost:8080" 
  width="100%" 
  height="700px" 
  frameborder="0"
  allow="accelerometer; autoplay; encrypted-media; gyroscope"
  style="border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: none;">
</iframe>
```

---

## 3. ⚙️ Các tham số tùy biến trên URL (Query Parameters)

Bạn có thể thêm các query parameter vào URL của iframe để tùy chỉnh giao diện phù hợp với layout của Web cha:

| Tham số | Giá trị | Tác dụng |
|---|---|---|
| `embed=1` | `1` | Ẩn thanh 4 nút bấm điều khiển bên dưới và ẩn menu test (dành cho Web cha muốn dùng nút bấm riêng). |
| `notest=1` | `1` | Ẩn menu thử nghiệm bên phải khi triển khai cho người dùng cuối. |
| `nohud=1` | `1` | Ẩn toàn bộ thẻ HUD thông số và cảnh báo, chỉ hiển thị duy nhất khung cảnh 3D. |
| `bg=transparent` | `transparent` | Làm nền canvas 3D trong suốt để hòa vào màu nền của Web cha. |

**Ví dụ nhúng không có nút bấm điều khiển:**
```html
<iframe src="http://localhost:8080?embed=1" width="100%" height="600px"></iframe>
```

**Ví dụ nhúng chỉ lấy không gian 3D nền trong suốt:**
```html
<iframe src="http://localhost:8080?nohud=1&bg=transparent" width="100%" height="600px"></iframe>
```

---

## 4. 📊 Cấu trúc Dữ liệu Telemetry & Trạng thái Hệ thống

Khi lắng nghe sự kiện `SMART_BIN_TELEMETRY` hoặc gửi dữ liệu qua `INJECT_TELEMETRY`, đối tượng `telemetry` tuân thủ schema chuẩn hóa sau:

### A. 4 Trường Telemetry Trọng yếu (Core Telemetry Fields)

| Trường | Kiểu dữ liệu | Đơn vị / Phạm vi | Mô tả chi tiết |
|---|---|---|---|
| `fillLevel` | `number` | `%` (0 – 100%) | Dung tích rác đã chứa trong thùng (tương đương `fillPct`). Được tính toán tự động từ vật lý 3D hoặc inject từ hệ thống bên ngoài. |
| `odorDetected` | `boolean` | `true` / `false` | Cảnh báo nồng độ khí mùi/hôi bốc lên từ rác. Hiển thị chip `CÓ MÙI HÔI` (đỏ) hoặc `KHÔNG MÙI` (xanh). |
| `batteryLevel` | `number` | `%` (0 – 100%) | Mức pin dự phòng của cảm biến IoT. Khi $\le 15\%$, chip pin đổi sang cảnh báo đỏ và kích hoạt lỗi `PIN_YẾU`. |
| `updatedAt` | `string` | `HH:mm:ss` / ISO | Thời gian cảm biến gửi bản tin đo lường cuối cùng (ví dụ `03:15:20` hoặc ISO 8601 string). |

### B. Các trường dữ liệu bổ trợ

| Trường | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `distanceCm` | `number` | Khoảng cách đo từ cảm biến siêu âm trên nắp xuống bề mặt rác (cm). |
| `count` | `number` | Tổng số lượng vật thể rác hiện có trong thùng. |
| `weightKg` | `string` / `number` | Tổng khối lượng rác ước tính (kg). |
| `status` | `string` | Cấp độ cảnh báo vận hành (`NORMAL`, `CAUTION`, `CRITICAL_FULL`, `SENSOR_FAULT`). |
| `faultReasons` | `string[]` | Danh sách chuỗi mô tả các sự cố cảm biến đang xảy ra (khi `status === 'SENSOR_FAULT'`). |
| `isFaultLatched` | `boolean` | Cờ chốt an toàn sự cố. Khi `true`, hệ thống khóa cứng trạng thái cảnh báo. |

---

## 5. ⚠️ Trạng thái SENSOR_FAULT ('CẦN XÁC MINH') & Mã lỗi (faultReasons)

Khi phát hiện bất thường, thuộc tính `status` lập tức chuyển thành **`SENSOR_FAULT`**. Trên giao diện HUD:
- Badge trạng thái chuyển sang màu tím với nhãn **`CẦN XÁC MINH`**.
- Banner cảnh báo nổi màu tím hiện thông báo chi tiết danh sách sự cố `Sự cố: <faultReasons>`.
- Nút bấm **[Xác minh sự cố]** (`btn-verify-fault`) xuất hiện cho phép quản trị viên/nhân viên xác nhận.

### 3 Mã lỗi cảm biến chuẩn (`faultReasons`):

1. **`PIN_YẾU` (Low Battery)**:
   - **Điều kiện kích hoạt**: Mức pin `batteryLevel <= 15%`.
   - **Ý nghĩa**: Cảm biến sắp hết pin, có nguy cơ ngắt kết nối hoặc mất tín hiệu đột ngột.

2. **`MẤT_TÍN_HIỆU` (Signal Loss / Heartbeat Timeout)**:
   - **Điều kiện kích hoạt**: Mất kết nối truyền thông hoặc không nhận được tín hiệu đo lường quá `6000ms` (Heartbeat Timeout). Hoặc inject `{ signalLoss: true }`.
   - **Ý nghĩa**: Đứt đường truyền LoRaWAN/NB-IoT, cảm biến treo hoặc mất kết nối gateway.

3. **`DỮ_LIỆU_NHẢY_BẤT_THƯỜNG` (Anomaly Jump & Out-of-Bounds)**:
   - **Điều kiện kích hoạt**: 
     * Dung tích rác nhảy vọt đột ngột $\ge 40\%$ (`deltaFill >= 40%`) mà không có lượng rác rơi vào tương ứng.
     * Hoặc giá trị dung tích nằm ngoài biên cho phép: `fillLevel < 0%`, `fillLevel > 105%`, hoặc giá trị `NaN`.
   - **Ý nghĩa**: Cảm biến siêu âm bị nhiễu sóng, vật cản bất thường che đầu đọc, hoặc hư hỏng phần cứng đo khoảng cách.

---

## 6. 🔒 Nguyên tắc Chốt An Toàn Cảnh Báo (Strict Latching Safety Rule)

> ### 🛑 QUY TẮC BẤT BIẾN (SAFETY INVARIANT):
> **"Tuyệt đối không được tự ý xóa hoặc hủy bỏ cảnh báo"**
> 
> Một khi cảm biến đã rơi vào trạng thái `SENSOR_FAULT`:
> 1. **Dữ liệu bình thường tiếp theo KHÔNG THỂ xóa lỗi**: Kể cả khi hệ thống nhận được các bản tin đo lường sau đó với giá trị `fillLevel` hợp lệ hay tín hiệu phục hồi, `status` vẫn giữ nguyên `SENSOR_FAULT`.
> 2. **Sạc lại pin KHÔNG THỂ xóa lỗi**: Đưa `batteryLevel` lên 100% không làm tắt lỗi `PIN_YẾU` đã chốt.
> 3. **Lệnh RESET_BIN / Làm rỗng thùng KHÔNG THỂ xóa lỗi**: Reset thùng chỉ làm sạch vật thể 3D, cờ sự cố `isFaultLatched` và `faultReasons` vẫn được bảo toàn nguyên vẹn.
> 4. **CHỈ CÓ THỂ XÓA BẰNG LỆNH XÁC NHẬN CÓ THẨM QUYỀN**: Duy nhất lệnh `VERIFY_FAULT` (gửi từ Web cha qua postMessage hoặc bấm nút [Xác minh sự cố] trên giao diện) mới có quyền giải phóng chốt an toàn và trả trạng thái về `NORMAL`.

---

## 7. 🔄 Giao tiếp hai chiều qua `window.postMessage` API

Web cha có thể **điều khiển mô phỏng 3D**, **bơm dữ liệu cảm biến (inject)**, **mô phỏng sự cố (simulate fault)**, **xác nhận lỗi (verify fault)** và **lắng nghe dữ liệu IoT thời gian thực**.

### A. Web cha gửi lệnh điều khiển xuống Microservice 3D

```javascript
const widgetIframe = document.getElementById('smart-bin-widget');

function sendCommand(type, payload = {}) {
  widgetIframe.contentWindow.postMessage({ type, ...payload }, '*');
}
```

#### 1. Bơm dữ liệu cảm biến giả lập (`INJECT_TELEMETRY`):
Cung cấp đầy đủ 4 trường telemetry để ép cập nhật giao diện 3D và HUD:
```javascript
sendCommand('INJECT_TELEMETRY', {
  data: {
    fillLevel: 68,              // Dung tích (%)
    odorDetected: true,         // Cảnh báo khí mùi (true/false)
    batteryLevel: 88,           // Mức pin (%)
    updatedAt: '15:42:10',      // Thời gian cập nhật
    distanceCm: 65,             // (Tùy chọn) Khoảng cách siêu âm (cm)
    count: 8                    // (Tùy chọn) Số lượng rác
  }
});
```

#### 2. Mô phỏng sự cố để kiểm thử chốt cảnh báo (`SIMULATE_FAULT`):
Hỗ trợ kích hoạt tức thì 1 trong 3 kịch bản lỗi:
```javascript
// Mô phỏng sự cố Pin yếu (<= 15%)
sendCommand('SIMULATE_FAULT', { faultType: 'LOW_BATTERY' });

// Mô phỏng sự cố Mất tín hiệu (> 6000ms timeout)
sendCommand('SIMULATE_FAULT', { faultType: 'SIGNAL_LOSS' });

// Mô phỏng sự cố Dữ liệu nhảy vọt bất thường (>= 40% jump)
sendCommand('SIMULATE_FAULT', { faultType: 'ANOMALY_JUMP' });
```

#### 3. Xác minh và xóa chốt cảnh báo có thẩm quyền (`VERIFY_FAULT`):
```javascript
// Xác minh sự cố, khôi phục trạng thái hoạt động bình thường
sendCommand('VERIFY_FAULT', {
  options: {
    restoreBattery: true        // Tự động khôi phục pin danh định nếu lỗi pin
  }
});
```

#### 4. Các lệnh tương tác 3D cơ bản khác:
```javascript
// Thả 1 chai nước vào thùng
sendCommand('DROP_BOTTLE');

// Thả 1 túi rác vào thùng
sendCommand('DROP_BAG');

// Làm rỗng thùng rác (không xóa chốt lỗi nếu đang có sự cố)
sendCommand('RESET_BIN');

// Bật/tắt chế độ tự động thả rác liên tục
sendCommand('SET_AUTO_FILL', { active: true });

// Yêu cầu phát ngay bản tin telemetry hiện tại
sendCommand('GET_TELEMETRY');

// Bật/tắt hiệu ứng âm thanh servo & còi báo
sendCommand('SET_SOUND', { enabled: false });
```

---

### B. Web cha lắng nghe sự kiện & dữ liệu IoT từ Microservice 3D

```javascript
window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.source !== 'smart-trashcan-microservice') return;

  switch (data.type) {
    // 1. Khi microservice 3D khởi tạo hoàn tất
    case 'SMART_BIN_READY':
      console.log('✅ Microservice 3D đã sẵn sàng!', data.payload);
      break;

    // 2. Nhận bản tin Telemetry thời gian thực
    case 'SMART_BIN_TELEMETRY': {
      const {
        fillLevel,       // 4 trường trọng yếu
        odorDetected,
        batteryLevel,
        updatedAt,
        status,          // 'NORMAL' | 'CAUTION' | 'CRITICAL_FULL' | 'SENSOR_FAULT'
        faultReasons,    // ['PIN_YẾU', 'MẤT_TÍN_HIỆU', ...]
        isFaultLatched,  // true / false
        distanceCm,
        count,
        weightKg
      } = data.payload;

      console.log(`[Telemetry] Dung tích: ${fillLevel}% | Mùi: ${odorDetected} | Pin: ${batteryLevel}% | Giờ: ${updatedAt}`);

      if (status === 'SENSOR_FAULT') {
        console.warn('⚠️ CẢNH BÁO SỰ CỐ CẦN XÁC MINH:', faultReasons);
      }
      break;
    }

    // 3. Sự kiện vật thể được thả
    case 'BOTTLE_DROPPED':
      console.log('Chai nước vừa rơi vào thùng, tổng số:', data.payload.count);
      break;

    case 'BAG_DROPPED':
      console.log('Túi rác vừa rơi vào thùng, tổng số:', data.payload.count);
      break;

    // 4. Sự kiện thùng được làm rỗng
    case 'BIN_RESET':
      console.log('Thùng rác đã được làm sạch!');
      break;
  }
});
```

---

## 8. 🛠 Ví dụ Tích hợp Hoàn chỉnh trong React / Next.js (TypeScript)

Dưới đây là một React Component hoàn chỉnh minh họa nhúng microservice, hiển thị telemetry, mô phỏng lỗi và giải phóng chốt an toàn:

```tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';

// Kiểu dữ liệu Telemetry chuẩn
export interface SmartBinTelemetry {
  fillLevel: number;        // Dung tích (%)
  fillPct?: number;
  odorDetected: boolean;    // Cảnh báo khí mùi
  batteryLevel: number;     // Mức pin (%)
  updatedAt: string;        // Thời gian cập nhật
  distanceCm: number;       // Khoảng cách siêu âm (cm)
  count: number;            // Số lượng rác
  weightKg: string | number;// Trọng lượng rác (kg)
  status: 'NORMAL' | 'CAUTION' | 'CRITICAL_FULL' | 'SENSOR_FAULT';
  faultReasons: string[];   // Danh sách mã lỗi
  isFaultLatched: boolean;  // Cờ chốt an toàn
}

export const SmartBinMicroservice: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [telemetry, setTelemetry] = useState<SmartBinTelemetry | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Gửi lệnh xuống iframe
  const postCommand = useCallback((type: string, payload: Record<string, any> = {}) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type, ...payload }, '*');
    }
  }, []);

  // Lắng nghe sự kiện từ iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.source !== 'smart-trashcan-microservice') return;

      if (data.type === 'SMART_BIN_READY') {
        setIsReady(true);
      } else if (data.type === 'SMART_BIN_TELEMETRY') {
        setTelemetry(data.payload as SmartBinTelemetry);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Lệnh Bơm Telemetry
  const handleInjectTelemetry = () => {
    postCommand('INJECT_TELEMETRY', {
      data: {
        fillLevel: 75,
        odorDetected: true,
        batteryLevel: 92,
        updatedAt: new Date().toLocaleTimeString('vi-VN')
      }
    });
  };

  // Lệnh Mô phỏng lỗi
  const handleSimulateLowBattery = () => {
    postCommand('SIMULATE_FAULT', { faultType: 'LOW_BATTERY' });
  };

  const handleSimulateAnomalyJump = () => {
    postCommand('SIMULATE_FAULT', { faultType: 'ANOMALY_JUMP' });
  };

  // Lệnh Xác minh sự cố (Clear Latch)
  const handleVerifyFault = () => {
    postCommand('VERIFY_FAULT', { options: { restoreBattery: true } });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>🗑️ Giám Sát Thùng Rác Thông Minh 3D (Microservice)</h2>
        <div>
          Trạng thái kết nối: <b>{isReady ? '🟢 Đã kết nối' : '🟡 Đang kết nối...'}</b>
        </div>
      </header>

      {/* Dashboard hiển thị 4 trường Telemetry trọng yếu */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '8px' }}>
          <small>Dung tích (fillLevel)</small>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: telemetry?.status === 'CRITICAL_FULL' ? '#ef4444' : '#0f172a' }}>
            {telemetry?.fillLevel ?? 0}%
          </div>
        </div>

        <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '8px' }}>
          <small>Mùi hôi (odorDetected)</small>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: telemetry?.odorDetected ? '#ef4444' : '#10b981' }}>
            {telemetry?.odorDetected ? 'CÓ MÙI HÔI' : 'KHÔNG MÙI'}
          </div>
        </div>

        <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '8px' }}>
          <small>Mức pin (batteryLevel)</small>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: (telemetry?.batteryLevel ?? 100) <= 15 ? '#ef4444' : '#10b981' }}>
            {telemetry?.batteryLevel ?? 0}%
          </div>
        </div>

        <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '8px' }}>
          <small>Cập nhật (updatedAt)</small>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#475569' }}>
            {telemetry?.updatedAt || '--:--:--'}
          </div>
        </div>
      </div>

      {/* Cảnh báo SENSOR_FAULT Latching Alert */}
      {telemetry?.status === 'SENSOR_FAULT' && (
        <div style={{ background: '#f3e8ff', border: '1px solid #c084fc', padding: '14px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ background: '#a855f7', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', marginRight: '8px' }}>
              CẦN XÁC MINH
            </span>
            <span style={{ color: '#6b21a8', fontWeight: 600 }}>
              Sự cố: {telemetry.faultReasons.join(', ')}
            </span>
            <div style={{ fontSize: '12px', color: '#7e22ce', marginTop: '4px' }}>
              * Latching Safety Rule: Cảnh báo được khóa bảo vệ an toàn cho đến khi quản trị viên xác minh.
            </div>
          </div>
          <button 
            onClick={handleVerifyFault}
            style={{ background: '#9333ea', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            ✓ Xác minh sự cố
          </button>
        </div>
      )}

      {/* Bảng điều khiển tác vụ từ Web cha */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <button onClick={() => postCommand('DROP_BOTTLE')} style={{ padding: '8px 14px', borderRadius: '6px' }}>+ Chai nước</button>
        <button onClick={() => postCommand('DROP_BAG')} style={{ padding: '8px 14px', borderRadius: '6px' }}>+ Túi rác</button>
        <button onClick={() => postCommand('RESET_BIN')} style={{ padding: '8px 14px', borderRadius: '6px' }}>↺ Làm rỗng</button>
        <button onClick={handleInjectTelemetry} style={{ padding: '8px 14px', borderRadius: '6px', background: '#e0f2fe' }}>💉 Inject Telemetry (75%)</button>
        <button onClick={handleSimulateLowBattery} style={{ padding: '8px 14px', borderRadius: '6px', background: '#fee2e2' }}>⚠️ Sim Lỗi Pin Yếu</button>
        <button onClick={handleSimulateAnomalyJump} style={{ padding: '8px 14px', borderRadius: '6px', background: '#fee2e2' }}>⚠️ Sim Nhảy Anomaly</button>
      </div>

      {/* Microservice Iframe */}
      <iframe
        ref={iframeRef}
        src="http://localhost:8080?embed=1"
        style={{ width: '100%', height: '650px', border: '1px solid #e2e8f0', borderRadius: '12px' }}
        title="Smart Bin 3D Widget"
      />
    </div>
  );
};

export default SmartBinMicroservice;
```

---

## 9. 🧪 Kiểm thử Tích hợp Độc lập (Node.js Test Script)

Bạn có thể chạy kiểm thử toàn bộ logic phát hiện sự cố, quy tắc chốt an toàn và lệnh `verifyFault()` mà không cần mở trình duyệt bằng script:

```bash
node test_sensor_fault.js
```
Kết quả kiểm thử kỳ vọng:
```
====================================================
  TESTING FAULT DETECTION & LATCHING INVARIANT
====================================================

--- Test Suite 1: Low Battery (<= 15%) ---
✅ PASS: Initial state: fault is not active
✅ PASS: Battery at 16% (> 15%) does not trigger fault
✅ PASS: Battery at 15% (<= 15%) triggers fault
✅ PASS: CRITICAL INVARIANT: Recharged battery does NOT clear fault
✅ PASS: CRITICAL INVARIANT: reset() does NOT clear fault
✅ PASS: verifyFault() successfully clears fault
...
====================================================
  ALL TESTS COMPLETED: 33 PASSED, 0 FAILED
====================================================
```
