import { TICKET_STATUS, TICKET_TYPE } from '../../../contracts/ticketStatus';
import { createDefaultTicket } from '../../../contracts/models';

/**
 * Deduplication Engine (Bộ xử lý chống trùng phiếu theo Trang 02 PDF)
 * - Nếu cùng thùng/cùng loại việc đang mở thì gộp vào phiếu cũ, giữ lịch sử từng sự kiện.
 * - Đơn rác cồng kềnh: khóa theo mã đơn (orderId), giữ riêng vật dụng, tiền và lịch.
 * - Mất mạng/lỗi cảm biến: Giữ nguyên phiếu đang mở, không tự xóa/hủy.
 */
export class DeduplicationEngine {
  /**
   * Danh sách các trạng thái coi là "phiếu đang mở / đang hoạt động"
   */
  static OPEN_STATUSES = [
    TICKET_STATUS.PENDING_PLAN,
    TICKET_STATUS.AWAITING_APPROVAL,
    TICKET_STATUS.ASSIGNED,
    TICKET_STATUS.IN_PROGRESS,
    TICKET_STATUS.AWAITING_INSPECTION,
    TICKET_STATUS.EXCEPTION,
  ];

  /**
   * Tìm kiếm phiếu việc đang mở phù hợp để chống trùng
   * @param {Array<Object>} existingTickets - Danh sách phiếu hiện có
   * @param {Object} criteria
   * @param {string} criteria.binId - Mã thùng
   * @param {string} criteria.type - Loại phiếu
   * @param {string} [criteria.orderId] - Mã đơn cồng kềnh (nếu có)
   * @returns {Object|null}
   */
  static findActiveTicket(existingTickets, { binId, type, orderId }) {
    if (!existingTickets || existingTickets.length === 0) return null;

    // Đối với rác cồng kềnh: Khóa theo mã đơn (orderId)
    if (type === TICKET_TYPE.BULKY_WASTE && orderId) {
      return (
        existingTickets.find(
          (t) =>
            this.OPEN_STATUSES.includes(t.status) &&
            t.type === TICKET_TYPE.BULKY_WASTE &&
            t.bulkyOrderId === orderId,
        ) || null
      );
    }

    // Đối với cảnh báo IoT hoặc lịch định kỳ: Tìm theo binId và type
    return (
      existingTickets.find(
        (t) => this.OPEN_STATUSES.includes(t.status) && t.binId === binId && t.type === type,
      ) || null
    );
  }

  /**
   * Xử lý sự kiện gửi đến: Gộp vào phiếu cũ hoặc tạo phiếu mới
   * @param {Array<Object>} existingTickets
   * @param {Object} eventData
   * @returns {{ updatedTickets: Array<Object>, resultTicket: Object, action: 'MERGED'|'CREATED' }}
   */
  static processEvent(existingTickets, eventData) {
    const {
      binId,
      type = TICKET_TYPE.IOT_OVERFLOW,
      orderId,
      source = 'IoT Telemetry',
      payload = {},
      householdId,
      address,
      lat,
      lng,
      priority,
      estimatedKg,
    } = eventData;

    const activeTicket = this.findActiveTicket(existingTickets, { binId, type, orderId });

    const now = new Date().toISOString();

    if (activeTicket) {
      // GỘP VÀO PHIẾU CŨ ĐANG MỞ
      const mergedEventEntry = {
        timestamp: now,
        source,
        payload,
      };

      const historyEntry = {
        timestamp: now,
        action: 'DEDUPLICATION_MERGED',
        performedBy: 'Hệ thống chống trùng (Deduplication Engine)',
        details: `Phát hiện sự kiện lặp từ ${source}. Đã gộp dữ liệu vào phiếu đang xử lý.`,
      };

      const updatedTicket = {
        ...activeTicket,
        updatedAt: now,
        mergedEvents: [...(activeTicket.mergedEvents || []), mergedEventEntry],
        history: [...(activeTicket.history || []), historyEntry],
        // Cập nhật số đo mới nhất nếu có trong payload
        ...(payload.fillLevel !== undefined ? { latestFillLevel: payload.fillLevel } : {}),
        ...(payload.odorLevel !== undefined ? { latestOdorLevel: payload.odorLevel } : {}),
      };

      const updatedTickets = existingTickets.map((t) =>
        t.id === activeTicket.id ? updatedTicket : t,
      );

      return {
        updatedTickets,
        resultTicket: updatedTicket,
        action: 'MERGED',
      };
    }

    // TẠO MỚI PHIẾU NẾU CHƯA CÓ PHIẾU NÀO ĐANG MỞ
    const newTicket = createDefaultTicket({
      binId,
      householdId,
      type,
      priority: priority || (payload.fillLevel >= 90 ? 'CRITICAL' : 'NORMAL'),
      address: address || `Điểm thu gom thùng ${binId}`,
      lat: lat || 10.7769,
      lng: lng || 106.7009,
      estimatedKg: estimatedKg || (payload.fillLevel ? Math.round(payload.fillLevel * 0.5) : 25),
      bulkyOrderId: orderId || null,
      latestFillLevel: payload.fillLevel,
      latestOdorLevel: payload.odorLevel,
      history: [
        {
          timestamp: now,
          action: 'TICKET_CREATED',
          performedBy: `Hệ thống (${source})`,
          details: `Khởi tạo phiếu do sự kiện phát sinh từ ${source}`,
        },
      ],
      mergedEvents: [],
    });

    return {
      updatedTickets: [newTicket, ...existingTickets],
      resultTicket: newTicket,
      action: 'CREATED',
    };
  }
}
