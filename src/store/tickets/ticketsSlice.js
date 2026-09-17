import { createSlice } from '@reduxjs/toolkit';
import { TICKET_STATUS, TICKET_TYPE, TICKET_PRIORITY } from '../../contracts/ticketStatus';
import { TicketStateMachineService } from '../../modules/tickets/services/TicketStateMachineService';
import { DeduplicationEngine } from '../../modules/tickets/services/DeduplicationEngine';

// Dữ liệu mẫu khởi tạo mô phỏng đa dạng trạng thái để kiểm thử quy trình
const initialMockTickets = [
  {
    id: 'TCK-20260917-001',
    binId: 'BIN-101',
    householdId: 'HH-8012',
    type: TICKET_TYPE.IOT_OVERFLOW,
    status: TICKET_STATUS.PENDING_PLAN,
    priority: TICKET_PRIORITY.HIGH,
    lat: 10.776889,
    lng: 106.700806,
    address: '128 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    deadline: new Date(Date.now() + 3600 * 1000 * 2).toISOString(),
    estimatedKg: 35,
    latestFillLevel: 92,
    latestOdorLevel: 45,
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
        timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        action: 'TICKET_CREATED',
        performedBy: 'Hệ thống IoT Telemetry',
        details: 'Cảm biến phát hiện mức đầy vượt ngưỡng (92%)',
      },
    ],
    mergedEvents: [],
  },
  {
    id: 'TCK-20260917-002',
    binId: 'BIN-102',
    householdId: 'HH-8013',
    type: TICKET_TYPE.SCHEDULED_COLLECTION,
    status: TICKET_STATUS.AWAITING_APPROVAL,
    priority: TICKET_PRIORITY.NORMAL,
    lat: 10.7745,
    lng: 106.7032,
    address: '45 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
    createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    deadline: new Date(Date.now() + 3600 * 1000 * 4).toISOString(),
    estimatedKg: 20,
    latestFillLevel: 65,
    latestOdorLevel: 20,
    assignedVehicleId: 'VEH-01',
    assignedDriverId: 'DRV-05',
    evidence: {
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      submittedAt: null,
      inspectedBy: null,
      note: '',
    },
    history: [
      {
        timestamp: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
        action: 'TICKET_CREATED',
        performedBy: 'Lịch định kỳ',
        details: 'Tạo phiếu theo chu kỳ thu gom thứ Năm hàng tuần',
      },
      {
        timestamp: new Date(Date.now() - 3600 * 1000 * 1.5).toISOString(),
        action: 'TRANSITION_PENDING_PLAN_TO_AWAITING_APPROVAL',
        performedBy: 'Bộ tối ưu VRP AI',
        details: 'Đã lập phương án tuyến và chọn xe VEH-01',
      },
    ],
    mergedEvents: [],
  },
  {
    id: 'TCK-20260917-003',
    binId: 'BIN-105',
    householdId: 'HH-8020',
    type: TICKET_TYPE.BULKY_WASTE,
    bulkyOrderId: 'BLK-902',
    status: TICKET_STATUS.IN_PROGRESS,
    priority: TICKET_PRIORITY.NORMAL,
    lat: 10.7785,
    lng: 106.6982,
    address: '88 Pasteur, Phường Bến Nghé, Quận 1, TP.HCM',
    createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    deadline: new Date(Date.now() + 3600 * 1000 * 1).toISOString(),
    estimatedKg: 60,
    assignedVehicleId: 'VEH-02',
    assignedDriverId: 'DRV-02',
    evidence: {
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      submittedAt: null,
      inspectedBy: null,
      note: '',
    },
    history: [
      {
        timestamp: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
        action: 'TICKET_CREATED',
        performedBy: 'Đơn cồng kềnh DEV 3',
        details: 'Cư dân đã trả trước đơn thu gom bộ bàn ghế cũ',
      },
      {
        timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        action: 'TRANSITION_AWAITING_APPROVAL_TO_ASSIGNED',
        performedBy: 'Điều phối viên',
        details: 'Phân công xe tải chuyên dụng VEH-02',
      },
      {
        timestamp: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
        action: 'TRANSITION_ASSIGNED_TO_IN_PROGRESS',
        performedBy: 'Tài xế DRV-02',
        details: 'Đã nhận nhiệm vụ và đang di chuyển tới điểm',
      },
    ],
    mergedEvents: [],
  },
  {
    id: 'TCK-20260917-004',
    binId: 'BIN-108',
    householdId: 'HH-8045',
    type: TICKET_TYPE.IOT_OVERFLOW,
    status: TICKET_STATUS.AWAITING_INSPECTION,
    priority: TICKET_PRIORITY.HIGH,
    lat: 10.7721,
    lng: 106.6955,
    address: '15 Tôn Thất Tùng, Phường Phạm Ngũ Lão, Quận 1, TP.HCM',
    createdAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    deadline: new Date(Date.now() + 3600 * 1000 * 1).toISOString(),
    estimatedKg: 40,
    assignedVehicleId: 'VEH-01',
    assignedDriverId: 'DRV-05',
    evidence: {
      beforePhotoUrl:
        'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&auto=format&fit=crop',
      afterPhotoUrl:
        'https://images.unsplash.com/photo-1503596476-1c12a8ba09a9?w=500&auto=format&fit=crop',
      submittedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      inspectedBy: null,
      note: 'Đã gom sạch rác tràn xung quanh thùng và lau nắp.',
    },
    history: [
      {
        timestamp: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
        action: 'TICKET_CREATED',
        performedBy: 'IoT Telemetry',
        details: 'Cảnh báo đầy 95%',
      },
      {
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        action: 'TRANSITION_IN_PROGRESS_TO_AWAITING_INSPECTION',
        performedBy: 'Tài xế DRV-05',
        details: 'Đã gửi ảnh trước/sau và xác nhận nghiệm thu tại điểm',
      },
    ],
    mergedEvents: [],
  },
  {
    id: 'TCK-20260917-005',
    binId: 'BIN-110',
    householdId: 'HH-8060',
    type: TICKET_TYPE.IOT_OVERFLOW,
    status: TICKET_STATUS.EXCEPTION,
    priority: TICKET_PRIORITY.CRITICAL,
    lat: 10.7712,
    lng: 106.6912,
    address: 'Hẻm 214 Nguyễn Trãi, Phường Nguyễn Cư Trinh, Quận 1, TP.HCM',
    createdAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
    deadline: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    estimatedKg: 30,
    assignedVehicleId: 'VEH-01',
    assignedDriverId: 'DRV-05',
    evidence: {
      beforePhotoUrl: null,
      afterPhotoUrl: null,
      submittedAt: null,
      inspectedBy: null,
      note: '',
    },
    history: [
      {
        timestamp: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
        action: 'TICKET_CREATED',
        performedBy: 'Hệ thống',
        details: 'Tạo phiếu thu gom',
      },
      {
        timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        action: 'TRANSITION_IN_PROGRESS_TO_EXCEPTION',
        performedBy: 'Tài xế DRV-05',
        details: 'Xe không tiếp cận được do công trình đào đường chắn toàn bộ đầu hẻm',
        reason: 'Hẻm thi công công trình ngầm, xe thu gom không thể vào',
      },
    ],
    mergedEvents: [],
  },
];

const initialState = {
  items: initialMockTickets,
  selectedTicketId: null,
  filters: {
    status: 'ALL',
    type: 'ALL',
    priority: 'ALL',
    search: '',
  },
  isLoading: false,
  error: null,
};

export const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    selectTicket: (state, action) => {
      state.selectedTicketId = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    processIncomingEvent: (state, action) => {
      const { updatedTickets } = DeduplicationEngine.processEvent(state.items, action.payload);
      state.items = updatedTickets;
    },
    transitionStatus: (state, action) => {
      const { ticketId, targetStatus, options } = action.payload;
      const index = state.items.findIndex((t) => t.id === ticketId);
      if (index !== -1) {
        state.items[index] = TicketStateMachineService.transition(
          state.items[index],
          targetStatus,
          options,
        );
      }
    },
    resolveException: (state, action) => {
      const { ticketId, returnToStatus, resolvedBy, resolutionNote } = action.payload;
      const index = state.items.findIndex((t) => t.id === ticketId);
      if (index !== -1) {
        state.items[index] = TicketStateMachineService.resolveException(
          state.items[index],
          returnToStatus,
          resolvedBy,
          resolutionNote,
        );
      }
    },
    submitEvidence: (state, action) => {
      const { ticketId, evidenceData } = action.payload;
      const index = state.items.findIndex((t) => t.id === ticketId);
      if (index !== -1) {
        state.items[index].evidence = {
          ...state.items[index].evidence,
          ...evidenceData,
          submittedAt: new Date().toISOString(),
        };
      }
    },
    assignVehicleAndDriver: (state, action) => {
      const { ticketId, vehicleId, driverId, performedBy = 'Điều phối viên' } = action.payload;
      const index = state.items.findIndex((t) => t.id === ticketId);
      if (index !== -1) {
        state.items[index] = TicketStateMachineService.transition(
          state.items[index],
          TICKET_STATUS.ASSIGNED,
          {
            performedBy,
            additionalData: {
              assignedVehicleId: vehicleId,
              assignedDriverId: driverId,
            },
          },
        );
      }
    },
  },
});

export const ticketsActions = ticketsSlice.actions;
export default ticketsSlice.reducer;
