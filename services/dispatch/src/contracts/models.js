import { TICKET_STATUS, TICKET_TYPE, TICKET_PRIORITY } from './ticketStatus';

/**
 * Cấu trúc đối tượng Số đo cảm biến thùng rác (DEV 1 -> DEV 2)
 * @typedef {Object} SmartBinTelemetry
 * @property {string} binId - Mã định danh thùng rác (VD: BIN-001)
 * @property {string} householdId - Mã hộ gia đình sở hữu thùng
 * @property {number} fillLevel - Mức độ đầy (%)
 * @property {number} odorLevel - Mức độ mùi (0 - 100)
 * @property {number} battery - Phần trăm pin thiết bị IoT (%)
 * @property {string} lastSeen - Thời điểm nhận tín hiệu gần nhất (ISO String)
 * @property {number} lat - Vĩ độ
 * @property {number} lng - Kinh độ
 * @property {boolean} isSensorFault - Trạng thái cảm biến có bị lỗi / mất mạng không
 */

/**
 * Cấu trúc đối tượng Trạng thái xe thu gom (DEV 1 -> DEV 2)
 * @typedef {Object} WasteVehicleState
 * @property {string} vehicleId - Mã định danh phương tiện
 * @property {string} [driverId] - Mã tài xế đang điều khiển
 * @property {number} currentCapacityKg - Khối lượng rác hiện có trên xe (Kg)
 * @property {number} maxCapacityKg - Tải trọng tối đa của xe (Kg)
 * @property {number} lat - Vĩ độ hiện tại từ Traccar GPS
 * @property {number} lng - Kinh độ hiện tại từ Traccar GPS
 * @property {'IDLE'|'EN_ROUTE'|'COLLECTING'|'UNLOADING'} status - Trạng thái xe
 */

/**
 * Cấu trúc đối tượng Đơn thu gom rác cồng kềnh (DEV 3 -> DEV 2)
 * @typedef {Object} BulkyWasteOrder
 * @property {string} orderId - Mã đơn hàng
 * @property {string} householdId - Mã hộ gia đình
 * @property {string} itemType - Loại vật dụng (sofa, nệm, tủ, v.v.)
 * @property {number} estimatedVol - Thể tích / khối lượng ước tính
 * @property {number} price - Giá dịch vụ đã tính
 * @property {boolean} isPaid - Đã thanh toán trả trước chưa
 * @property {string} pickupDate - Ngày hẹn thu gom mong muốn (YYYY-MM-DD)
 * @property {string} address - Địa chỉ chi tiết
 * @property {number} lat - Vĩ độ
 * @property {number} lng - Kinh độ
 */

/**
 * Cấu trúc đối tượng Trạng thái dịch vụ hộ gia đình (DEV 3 -> DEV 2)
 * @typedef {Object} HouseholdServiceStatus
 * @property {string} householdId - Mã hộ gia đình
 * @property {boolean} serviceActive - Dịch vụ có đang hoạt động hay không
 * @property {number} debtDays - Số ngày quá hạn nợ phí
 * @property {string} [suspendedReason] - Lý do tạm ngừng dịch vụ (nếu có)
 */

/**
 * Cấu trúc đối tượng Phiếu việc thu gom (Ticket)
 * @typedef {Object} Ticket
 * @property {string} id - Mã phiếu việc (VD: TCK-20260917-001)
 * @property {string} binId - Mã thùng rác liên kết
 * @property {string} [householdId] - Mã hộ gia đình
 * @property {keyof typeof TICKET_TYPE} type - Loại phiếu
 * @property {keyof typeof TICKET_STATUS} status - Trạng thái hiện tại
 * @property {keyof typeof TICKET_PRIORITY} priority - Mức độ ưu tiên
 * @property {number} lat - Vĩ độ điểm thu gom
 * @property {number} lng - Kinh độ điểm thu gom
 * @property {string} address - Địa chỉ thu gom
 * @property {string} createdAt - Thời gian tạo phiếu
 * @property {string} deadline - Hạn xử lý tối đa
 * @property {number} estimatedKg - Ước tính khối lượng rác (Kg)
 * @property {string} [assignedVehicleId] - Mã xe được phân công
 * @property {string} [assignedDriverId] - Mã tài xế được phân công
 * @property {Object} [evidence] - Bằng chứng nghiệm thu
 * @property {string} [evidence.beforePhotoUrl] - Ảnh trước khi gom
 * @property {string} [evidence.afterPhotoUrl] - Ảnh sau khi gom
 * @property {string} [evidence.submittedAt] - Thời gian gửi bằng chứng
 * @property {string} [evidence.inspectedBy] - Người duyệt nghiệm thu
 * @property {string} [evidence.note] - Ghi chú nghiệm thu
 * @property {Array<{ timestamp: string, action: string, performedBy: string, details?: string }>} history - Lịch sử thao tác
 * @property {Array<{ timestamp: string, source: string, payload: Object }>} mergedEvents - Danh sách sự kiện lặp được gộp
 */

export const createDefaultTicket = (overrides = {}) => ({
  id: `TCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  binId: '',
  householdId: '',
  type: TICKET_TYPE.IOT_OVERFLOW,
  status: TICKET_STATUS.PENDING_PLAN,
  priority: TICKET_PRIORITY.NORMAL,
  lat: 10.7769,
  lng: 106.7009,
  address: '',
  createdAt: new Date().toISOString(),
  deadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(), // Mặc định 4 tiếng
  estimatedKg: 20,
  assignedVehicleId: null,
  assignedDriverId: null,
  evidence: {
    beforePhotoUrl: null,
    afterPhotoUrl: null,
    submittedAt: null,
    inspectedBy: null,
    note: '',
  },
  history: [
    {
      timestamp: new Date().toISOString(),
      action: 'TICKET_CREATED',
      performedBy: 'Hệ thống tự động',
      details: 'Khởi tạo phiếu việc',
    },
  ],
  mergedEvents: [],
  ...overrides,
});
