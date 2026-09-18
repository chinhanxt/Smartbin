/**
 * Trạng thái chuẩn của Phiếu việc theo quy trình 6 bước + ngoại lệ (Trang 06 PDF)
 */
export const TICKET_STATUS = {
  PENDING_PLAN: 'PENDING_PLAN', // Chờ lập kế hoạch: Nhận nhu cầu từ IoT / Lịch định kỳ / Đơn cồng kềnh
  AWAITING_APPROVAL: 'AWAITING_APPROVAL', // Chờ duyệt: Đã có phương án tuyến khả thi
  ASSIGNED: 'ASSIGNED', // Đã giao: Đang chờ tài xế xác nhận nhận nhiệm vụ
  IN_PROGRESS: 'IN_PROGRESS', // Đang thực hiện: Tài xế đã nhận việc và đang di chuyển / xử lý
  AWAITING_INSPECTION: 'AWAITING_INSPECTION', // Chờ nghiệm thu: Đã gửi kết quả và bằng chứng trước/sau
  COMPLETED: 'COMPLETED', // Hoàn thành: Nghiệm thu đạt hoặc ngoại lệ được cấp quản lý duyệt
  EXCEPTION: 'EXCEPTION', // Ngoại lệ: Xe hỏng, từ chối việc, hẻm cụt, cảm biến lỗi
};

/**
 * Nhãn tiếng Việt tương ứng cho từng trạng thái
 */
export const TICKET_STATUS_LABELS = {
  [TICKET_STATUS.PENDING_PLAN]: 'Chờ lập kế hoạch',
  [TICKET_STATUS.AWAITING_APPROVAL]: 'Chờ duyệt',
  [TICKET_STATUS.ASSIGNED]: 'Đã giao việc',
  [TICKET_STATUS.IN_PROGRESS]: 'Đang thực hiện',
  [TICKET_STATUS.AWAITING_INSPECTION]: 'Chờ nghiệm thu',
  [TICKET_STATUS.COMPLETED]: 'Hoàn thành',
  [TICKET_STATUS.EXCEPTION]: 'Ngoại lệ / Cần xử lý',
};

/**
 * Mã màu nhận diện trực quan cho từng trạng thái
 */
export const TICKET_STATUS_COLORS = {
  [TICKET_STATUS.PENDING_PLAN]: '#f59e0b', // Amber / Cam vàng
  [TICKET_STATUS.AWAITING_APPROVAL]: '#3b82f6', // Lam
  [TICKET_STATUS.ASSIGNED]: '#8b5cf6', // Tím
  [TICKET_STATUS.IN_PROGRESS]: '#06b6d4', // Cyan
  [TICKET_STATUS.AWAITING_INSPECTION]: '#eab308', // Vàng
  [TICKET_STATUS.COMPLETED]: '#10b981', // Xanh lá
  [TICKET_STATUS.EXCEPTION]: '#ef4444', // Đỏ
};

/**
 * Loại công việc (Task / Ticket Types)
 */
export const TICKET_TYPE = {
  IOT_OVERFLOW: 'IOT_OVERFLOW', // Thu gom đột xuất do cảm biến báo đầy/mùi
  SCHEDULED_COLLECTION: 'SCHEDULED_COLLECTION', // Thu gom theo lịch định kỳ
  BULKY_WASTE: 'BULKY_WASTE', // Thu gom rác cồng kềnh trả trước
  CLEANING_MAINTENANCE: 'CLEANING_MAINTENANCE', // Vệ sinh / kiểm tra bảo dưỡng thùng
};

export const TICKET_TYPE_LABELS = {
  [TICKET_TYPE.IOT_OVERFLOW]: 'IoT cảnh báo đầy',
  [TICKET_TYPE.SCHEDULED_COLLECTION]: 'Thu gom định kỳ',
  [TICKET_TYPE.BULKY_WASTE]: 'Rác cồng kềnh',
  [TICKET_TYPE.CLEANING_MAINTENANCE]: 'Vệ sinh & Bảo dưỡng',
};

/**
 * Mức độ ưu tiên của phiếu
 */
export const TICKET_PRIORITY = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const TICKET_PRIORITY_LABELS = {
  [TICKET_PRIORITY.LOW]: 'Thấp',
  [TICKET_PRIORITY.NORMAL]: 'Bình thường',
  [TICKET_PRIORITY.HIGH]: 'Cao',
  [TICKET_PRIORITY.CRITICAL]: 'Khẩn cấp',
};
