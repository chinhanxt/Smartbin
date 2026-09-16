# HƯỚNG DẪN DÀNH CHO AI ASSISTANT & DEV 2 (congnghip)
**Nhánh Git:** `dev-congnghip`  
**Vai trò:** Developer 2 - Ticket Lifecycle Engine, Route Optimization & Dispatcher Admin  
**Tài liệu tham chiếu:** [quy-trinh-thu-gom-iot-traccar-ai (1).pdf](file:///home/congnghiep/nghich/Smartbin/quy-trinh-thu-gom-iot-traccar-ai%20%281%29.pdf) (Trọng tâm: **Trang 01, 02, 03, 04, 06, 07**)  
**Quy tắc chung toàn team:** [TEAM_WORKFLOW_RULES.md](file:///home/congnghiep/nghich/Smartbin/TEAM_WORKFLOW_RULES.md)

---

> [!IMPORTANT]
> ### CHỈ THỊ BẮT BUỘC CHO TẤT CẢ AI ASSISTANT LÀM VIỆC TRÊN NHÁNH NÀY:
> 1. Bạn đang hỗ trợ **DEV 2 (congnghip)** trên nhánh `dev-congnghip`.
> 2. **CHỈ ĐƯỢC PHÉP** tạo mới và chỉnh sửa mã nguồn trong phạm vi thư mục được phân quyền cho Dev 2:
>    * `src/modules/tickets/` (Quản lý phiếu việc, máy trạng thái 6 bước, chống trùng phiếu, bằng chứng nghiệm thu)
>    * `src/modules/dispatch/` (Bảng điều khiển Điều phối viên, phân công xe, xử lý từ chối việc/xe hỏng)
>    * `src/modules/routing/` (Bộ tối ưu hóa tuyến đường OR-Tools/Heuristics có ràng buộc sức chứa & thời gian)
>    * `src/store/tickets/` & `src/store/dispatch/` (Redux slices độc lập của Dev 2)
> 3. **TUYỆT ĐỐI KHÔNG ĐƯỢC CHẠM VÀO** các thư mục thuộc phạm vi của Dev 1 (`fleet/`, `iot-bins/`) hoặc Dev 3 (`citizen/`, `billing/`, `bulky/`).
> 4. **TUYỆT ĐỐI KHÔNG SỬA TRỰC TIẾP** vào `src/Navigation.jsx` hay `src/store/index.js` để tránh gây xung đột Git (Merge Conflict) với Dev 1 và Dev 3. Hãy xuất route tại `src/modules/tickets/routes.jsx` và `src/modules/dispatch/routes.jsx`.

---

## 1. MỤC TIÊU NGHIỆP VỤ CỦA DEV 2 (THEO PDF)

### Trang 01, 02 & 06: Vòng đời Phiếu việc & Chống Trùng (Ticket Lifecycle Engine)
- Triển khai máy trạng thái chuẩn **6 trạng thái tuần tự + 1 trạng thái ngoại lệ** (Trang 06):
  1. `Chờ lập kế hoạch` (`PENDING_PLAN`): Nhận nhu cầu hợp lệ từ IoT / Lịch định kỳ / Đơn cồng kềnh.
  2. `Chờ duyệt` (`AWAITING_APPROVAL`): Đã có phương án tuyến khả thi.
  3. `Đã giao` (`ASSIGNED`): Đã gửi danh sách điểm đến tài xế/xe, chờ tài xế nhận việc.
  4. `Đang thực hiện` (`IN_PROGRESS`): Tài xế đã xác nhận nhận nhiệm vụ.
  5. `Chờ nghiệm thu` (`AWAITING_INSPECTION`): Đã gửi ảnh trước/sau và xác nhận hoàn thành tại điểm.
  6. `Hoàn thành` (`COMPLETED`): Nghiệm thu đạt hoặc ngoại lệ được cấp quản lý duyệt.
  * `Ngoại lệ` (`EXCEPTION`): Xe hỏng, từ chối việc, ngõ cụt không vào được, cảm biến lỗi.
- **Quy tắc vàng:**
  * Một mã phiếu theo suốt vòng đời; thay đổi phân công không làm mất lịch sử xử lý.
  * Cảm biến mất mạng **không được tự ý hủy phiếu**.
  * Chống trùng khi ghi phiếu (Trang 02): Nếu cùng thùng/cùng loại việc đang mở thì gộp vào phiếu cũ, giữ lịch sử từng sự kiện.

### Trang 03 & 07: Lập Phương án & Tối ưu hóa Tuyến đường (Route Optimizer)
- Thuật toán định tuyến có ràng buộc (OR-Tools / VRP Solver):
  * Đầu vào: Danh sách phiếu hợp lệ, trạng thái hộ còn hiệu lực (không bị tạm ngừng nợ), tải trọng xe (từ Dev 1), giờ ca làm việc, vị trí điểm dỡ rác.
  * Tiêu chí tối ưu: Tổng quãng đường ngắn nhất, không vượt quá sức chứa xe, đáp ứng hạn giờ xử lý.
- Giao diện Điều phối viên (Dispatcher Hub):
  * Xem bản đồ lộ trình đề xuất, chỉnh sửa thứ tự điểm nếu cần.
  * Phê duyệt phương án theo phiên bản (versioning).
  * Chống giao việc trùng: Một người/xe chỉ chịu trách nhiệm tại một thời điểm.
- Xử lý sự cố giữa chừng (Trang 03): Nếu xe hỏng hoặc tài xế từ chối việc, **chỉ lập lại lộ trình cho phần điểm chưa thực hiện**, giữ nguyên các điểm đã nghiệm thu xong.

### Trang 04: Nghiệm thu tại Điểm gom rác
- Kiểm tra bằng chứng hiện trường: Ảnh chụp trước và sau thu gom, mã thùng, thời gian, tài xế xác nhận.
- Đạt tiêu chí nghiệm thu thì cập nhật trạng thái `COMPLETED` và kích hoạt cộng dồn tải trọng xe.
- Nếu không đạt (chưa xử lý hết hoặc cảm biến sai lệch): Chuyển trạng thái ngoại lệ để cấp quản lý xác minh, ghi rõ lý do.

---

## 2. RANH GIỚI FILE VÀ THƯ MỤC CỦA DEV 2

```
src/
├── modules/
│   ├── tickets/                 <-- [DEV 2 TOÀN QUYỀN]
│   │   ├── components/          # TicketCard, TicketTimeline, EvidenceViewer, ExceptionModal
│   │   ├── pages/               # TicketListPage, TicketDetailPage
│   │   ├── services/            # TicketStateMachineService, DeduplicationEngine
│   │   └── routes.jsx           # Khai báo route riêng của Tickets
│   ├── dispatch/                <-- [DEV 2 TOÀN QUYỀN]
│   │   ├── components/          # DispatchBoard, DriverAssignmentModal, ShiftSchedule
│   │   ├── pages/               # DispatcherDashboardPage
│   │   └── routes.jsx           # Khai báo route riêng của Dispatch
│   └── routing/                 <-- [DEV 2 TOÀN QUYỀN]
│       ├── components/          # RouteMapPreview, WaypointList, ConstraintSettings
│       └── services/            # RouteOptimizationService (OR-Tools/VRP wrapper)
├── store/
│   ├── tickets/                 <-- [DEV 2 TOÀN QUYỀN]
│   └── dispatch/                <-- [DEV 2 TOÀN QUYỀN]
└── contracts/                   <-- [DÙNG CHUNG] Đọc interface tại đây
```

---

## 3. GIAO ƯỚC DỮ LIỆU CẦN TIÊU THỤ VÀ CUNG CẤP

### Tiêu thụ từ DEV 1:
- Danh sách thùng rác vượt ngưỡng để tự động sinh phiếu (`SmartBinTelemetry`).
- Tọa độ GPS xe thực tế và sức chứa hiện tại (`WasteVehicleState`).

### Tiêu thụ từ DEV 3:
- Đơn rác cồng kềnh đã thanh toán trả trước (`BulkyWasteOrder`) để gom vào bài toán định tuyến xe chuyên dụng.
- Trạng thái hợp đồng của hộ (`HouseholdServiceStatus`) - nếu hộ đang bị `TẠM NGỪNG DO NỢ` thì loại trừ khỏi tuyến thu gom định kỳ (Trang 10).

### Cung cấp cho DEV 3:
- Lịch xe đến dự kiến theo kết quả tối ưu hóa tuyến để hiển thị lên App Công Dân.

---

## 4. QUY TRÌNH LÀM VIỆC TRÊN NHÁNH `dev-congnghip`

Trước khi bắt đầu code mỗi ngày hoặc trước khi chuẩn bị tạo Pull Request:
```bash
# 1. Cập nhật mã nguồn mới nhất từ nhánh main
git fetch origin
git rebase origin/main

# 2. Kiểm tra code style và build
npm run lint
npm run build

# 3. Đẩy lên nhánh remote
git push origin dev-congnghip
```

> Hãy tuân thủ nghiêm ngặt ranh giới thư mục để đảm bảo khi tạo PR vào `main`, lệnh merge sẽ diễn ra tự động 100% không có bất kỳ conflict nào!
