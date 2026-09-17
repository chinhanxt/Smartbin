import { TICKET_STATUS } from '../../../contracts/ticketStatus';

/**
 * Service quản lý máy trạng thái (State Machine) của Phiếu việc theo Trang 06 PDF
 */
export class TicketStateMachineService {
  /**
   * Danh sách các bước chuyển trạng thái hợp lệ trong luồng chuẩn
   */
  static VALID_TRANSITIONS = {
    [TICKET_STATUS.PENDING_PLAN]: [TICKET_STATUS.AWAITING_APPROVAL, TICKET_STATUS.EXCEPTION],
    [TICKET_STATUS.AWAITING_APPROVAL]: [
      TICKET_STATUS.ASSIGNED,
      TICKET_STATUS.PENDING_PLAN, // Nếu điều phối viên từ chối phương án
      TICKET_STATUS.EXCEPTION,
    ],
    [TICKET_STATUS.ASSIGNED]: [
      TICKET_STATUS.IN_PROGRESS, // Tài xế nhận việc
      TICKET_STATUS.EXCEPTION, // Từ chối việc hoặc quá hạn nhận việc
    ],
    [TICKET_STATUS.IN_PROGRESS]: [
      TICKET_STATUS.AWAITING_INSPECTION, // Hoàn thành thu gom, gửi bằng chứng
      TICKET_STATUS.EXCEPTION, // Xe hỏng / hẻm tắc / sự cố hiện trường
    ],
    [TICKET_STATUS.AWAITING_INSPECTION]: [
      TICKET_STATUS.COMPLETED, // Nghiệm thu đạt
      TICKET_STATUS.IN_PROGRESS, // Chưa đạt, cần xử lý lại tại điểm
      TICKET_STATUS.EXCEPTION, // Bằng chứng bất nhất hoặc cảm biến nghi ngờ lỗi
    ],
    [TICKET_STATUS.COMPLETED]: [], // Trạng thái cuối, không chuyển tiếp
    [TICKET_STATUS.EXCEPTION]: [
      // Sau khi quản lý xử lý ngoại lệ, có thể quay lại các bước tùy tình huống
      TICKET_STATUS.PENDING_PLAN,
      TICKET_STATUS.AWAITING_APPROVAL,
      TICKET_STATUS.ASSIGNED,
      TICKET_STATUS.IN_PROGRESS,
      TICKET_STATUS.AWAITING_INSPECTION,
      TICKET_STATUS.COMPLETED, // Quản lý duyệt ngoại lệ đặc cách
    ],
  };

  /**
   * Kiểm tra xem việc chuyển từ trạng thái hiện tại sang trạng thái mới có hợp lệ hay không
   * @param {string} currentStatus
   * @param {string} targetStatus
   * @returns {boolean}
   */
  static canTransition(currentStatus, targetStatus) {
    if (!currentStatus || !targetStatus) return false;
    const allowed = this.VALID_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  /**
   * Thực hiện chuyển trạng thái cho phiếu việc, tự động cập nhật lịch sử
   * @param {Object} ticket - Phiếu việc hiện tại
   * @param {string} targetStatus - Trạng thái đích
   * @param {Object} options
   * @param {string} options.performedBy - Tên/ID người thực hiện thao tác
   * @param {string} [options.reason] - Lý do (bắt buộc khi chuyển sang EXCEPTION hoặc từ chối duyệt)
   * @param {Object} [options.additionalData] - Dữ liệu bổ sung (ảnh nghiệm thu, xe gán, v.v.)
   * @returns {Object} Phiếu việc mới sau khi cập nhật
   */
  static transition(ticket, targetStatus, options = {}) {
    const { performedBy = 'Hệ thống', reason = '', additionalData = {} } = options;

    if (!this.canTransition(ticket.status, targetStatus)) {
      throw new Error(
        `Chuyển trạng thái không hợp lệ từ "${ticket.status}" sang "${targetStatus}"!`,
      );
    }

    // Quy tắc: Chuyển sang EXCEPTION bắt buộc phải có lý do
    if (targetStatus === TICKET_STATUS.EXCEPTION && !reason.trim()) {
      throw new Error('Chuyển sang trạng thái Ngoại lệ (EXCEPTION) bắt buộc phải cung cấp lý do!');
    }

    const now = new Date().toISOString();
    const actionLabel = `TRANSITION_${ticket.status}_TO_${targetStatus}`;

    const newHistoryEntry = {
      timestamp: now,
      action: actionLabel,
      fromStatus: ticket.status,
      toStatus: targetStatus,
      performedBy,
      reason: reason || undefined,
      ...additionalData,
    };

    return {
      ...ticket,
      ...additionalData,
      status: targetStatus,
      updatedAt: now,
      history: [...(ticket.history || []), newHistoryEntry],
    };
  }

  /**
   * Xử lý ngoại lệ: Người có thẩm quyền phê duyệt đưa phiếu trở lại quy trình
   * @param {Object} ticket
   * @param {string} returnToStatus
   * @param {string} resolvedBy
   * @param {string} resolutionNote
   */
  static resolveException(ticket, returnToStatus, resolvedBy, resolutionNote) {
    if (ticket.status !== TICKET_STATUS.EXCEPTION) {
      throw new Error('Chỉ có thể xử lý ngoại lệ cho phiếu đang ở trạng thái EXCEPTION!');
    }

    return this.transition(ticket, returnToStatus, {
      performedBy: resolvedBy,
      reason: `Quản lý xử lý ngoại lệ: ${resolutionNote}`,
      additionalData: {
        exceptionResolvedAt: new Date().toISOString(),
        exceptionResolvedBy: resolvedBy,
      },
    });
  }
}
