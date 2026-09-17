/**
 * WasteSimulationEngine.js
 * Động cơ mô phỏng thời gian thực cho hệ thống thu gom rác thông minh (Smartbin AI Dispatch)
 * - Quản lý các thùng rác cố định và vị trí thùng rác thêm mới tùy ý
 * - Mô phỏng tốc độ đầy rác theo thời gian (fill rate)
 * - TÍCH HỢP THUẬT TOÁN TỐI ƯU QUẢN ĐƯỜNG (2-Opt TSP & CVRP Solver)
 * - ĐIỀU HƯỚNG BÁM MẠNG LƯỚI ĐƯỜNG BỘ THỰC TẾ (OSRM Road Network Coordinates TP.HCM)
 * - Xe di chuyển mượt mà bám theo tim đường, tự động cua rẽ tại các góc phố, thu gom và xả rác tại Depot
 */

import { roadRoutingService } from '../../routing/services/RoadRoutingService.js';
import { RouteOptimizationService } from '../../routing/services/RouteOptimizationService.js';

// Hàm tính khoảng cách Haversine (Km)
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Hàm tính góc phương vị (Bearing/Heading) 0-360 độ
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Trạm trung chuyển / Bãi dỡ rác mặc định
// Danh sách các trạm trung chuyển / Bãi dỡ rác chiến lược tại TP.HCM
export const DEFAULT_DEPOTS = [
  {
    id: 'DEPOT-01',
    name: 'Trạm Dỡ Rác 1 - Nam Sài Gòn (Bến Vân Đồn)',
    shortName: 'Depot 1 (Nam)',
    lat: 10.7615,
    lng: 106.6912,
    address: 'Khu liên hiệp xử lý rác Bến Vân Đồn, Q.4 / Q.1',
  },
  {
    id: 'DEPOT-02',
    name: 'Trạm Dỡ Rác 2 - Bắc Sài Gòn (Đa Kao - Thị Nghè)',
    shortName: 'Depot 2 (Bắc)',
    lat: 10.7892,
    lng: 106.7025,
    address: 'Trạm trung chuyển xử lý rác Đa Kao, Q.1',
  },
];

// Depot mặc định để tương thích ngược
export const DEFAULT_DEPOT = DEFAULT_DEPOTS[0];

// Dữ liệu 16 thùng rác phân bố thưa, thoáng đạt khắp các địa danh tiêu biểu (Quận 1 - Q.3 - Q.4)
// Khoảng cách giữa các thùng trung bình từ 600m - 1.2km, đảm bảo không bị chồng chéo điểm ghim
export const INITIAL_BINS = [
  {
    id: 'BIN-101',
    name: 'Thùng rác Chợ Bến Thành',
    address: 'Cửa Nam Chợ Bến Thành, Q.1',
    lat: 10.77255,
    lng: 106.69812,
    capacityKg: 150,
    currentFillPercent: 65,
    fillRate: 0.12,
    status: 'NORMAL',
    assignedVehicleId: null,
    assignedStopNumber: null,
  },
  {
    id: 'BIN-102',
    name: 'Thùng rác Phố Đi Bộ Nguyễn Huệ',
    address: '45 Nguyễn Huệ, P. Bến Nghé, Q.1',
    lat: 10.7745,
    lng: 106.7038,
    capacityKg: 160,
    currentFillPercent: 78,
    fillRate: 0.14,
    status: 'NORMAL',
    assignedVehicleId: null,
    assignedStopNumber: null,
  },
  {
    id: 'BIN-103',
    name: 'Thùng rác Bến Bạch Đằng',
    address: 'Số 2 Tôn Đức Thắng, P. Bến Nghé, Q.1',
    lat: 10.7735,
    lng: 106.7075,
    capacityKg: 150,
    currentFillPercent: 42,
    fillRate: 0.1,
    status: 'NORMAL',
    assignedVehicleId: null,
    assignedStopNumber: null,
  },
  {
    id: 'BIN-104',
    name: 'Thùng rác Nhà Thờ Đức Bà',
    address: 'Số 1 Công xã Paris, P. Bến Nghé, Q.1',
    lat: 10.779786,
    lng: 106.699018,
    capacityKg: 140,
    currentFillPercent: 86, // Đã đầy cần gom
    fillRate: 0.15,
    status: 'OVERFLOW',
    assignedVehicleId: null,
    assignedStopNumber: null,
  },
  {
    id: 'BIN-105',
    name: 'Thùng rác Hồ Con Rùa',
    address: 'Vòng xoay Công trường Quốc Tế, Q.3',
    lat: 10.7828,
    lng: 106.6958,
    capacityKg: 150,
    currentFillPercent: 52,
    fillRate: 0.12,
    status: 'NORMAL',
    assignedVehicleId: null,
    assignedStopNumber: null,
  },
  {
    id: 'BIN-106',
    name: 'Thùng rác Phố Tây Bùi Viện',
    address: '102 Bùi Viện, P. Phạm Ngũ Lão, Q.1',
    lat: 10.7685,
    lng: 106.692,
    capacityKg: 180,
    currentFillPercent: 88, // Đã đầy cần gom
    fillRate: 0.16,
    status: 'OVERFLOW',
    assignedVehicleId: null,
    assignedStopNumber: null,
  },
  {
    id: 'BIN-107',
    name: 'Thùng rác Bến Vân Đồn',
    address: '180 Bến Vân Đồn, Phường 9, Quận 4',
    lat: 10.7632,
    lng: 106.7012,
    capacityKg: 160,
    currentFillPercent: 82, // Đã đầy cần gom
    fillRate: 0.14,
    status: 'OVERFLOW',
    assignedVehicleId: null,
    assignedStopNumber: null,
  },
  {
    id: 'BIN-108',
    name: 'Thùng rác Cầu Ông Lãnh',
    address: 'Đầu cầu Ông Lãnh, P. Cầu Ông Lãnh, Q.1',
    lat: 10.7622,
    lng: 106.6942,
    capacityKg: 140,
    currentFillPercent: 46,
    fillRate: 0.11,
    status: 'NORMAL',
    assignedVehicleId: null,
    assignedStopNumber: null,
  },
  {
    id: 'BIN-109',
    name: 'Thùng rác Thảo Cầm Viên',
    address: 'Số 2 Nguyễn Bỉnh Khiêm, P. Bến Nghé, Q.1',
    lat: 10.7875,
    lng: 106.705,
    capacityKg: 150,
    currentFillPercent: 58,
    fillRate: 0.12,
    status: 'NORMAL',
    assignedVehicleId: null,
    assignedStopNumber: null,
  },
  {
    id: 'BIN-110',
    name: 'Thùng rác Chợ Đa Kao',
    address: 'Góc Đinh Tiên Hoàng - Nguyễn Huy Tự, Q.1',
    lat: 10.7912,
    lng: 106.6985,
    capacityKg: 140,
    currentFillPercent: 68,
    fillRate: 0.13,
    status: 'NORMAL',
    assignedVehicleId: null,
    assignedStopNumber: null,
  },
  {
    id: 'BIN-111',
    name: 'Thùng rác Dinh Độc Lập',
    address: '135 Nam Kỳ Khởi Nghĩa, P. Bến Thành, Q.1',
    lat: 10.777,
    lng: 106.6945,
    capacityKg: 140,
    currentFillPercent: 48,
    fillRate: 0.1,
    status: 'NORMAL',
    assignedVehicleId: null,
    assignedStopNumber: null,
  },
  {
    id: 'BIN-112',
    name: 'Thùng rác Chợ Dân Sinh',
    address: '104 Yersin, P. Cầu Ông Lãnh, Q.1',
    lat: 10.7665,
    lng: 106.6965,
    capacityKg: 150,
    currentFillPercent: 54,
    fillRate: 0.11,
    status: 'NORMAL',
    assignedVehicleId: null,
    assignedStopNumber: null,
  },
  {
    id: 'BIN-113',
    name: 'Thùng rác Công Viên Tao Đàn',
    address: '55 Trương Định, P. Bến Thành, Q.1',
    lat: 10.7748,
    lng: 106.6918,
    capacityKg: 150,
    currentFillPercent: 84, // Đã đầy cần gom
    fillRate: 0.14,
    status: 'OVERFLOW',
    assignedVehicleId: null,
    assignedStopNumber: null,
  },
  {
    id: 'BIN-114',
    name: 'Thùng rác Chợ Tân Định',
    address: '336 Hai Bà Trưng, P. Tân Định, Q.1',
    lat: 10.7905,
    lng: 106.6908,
    capacityKg: 160,
    currentFillPercent: 60,
    fillRate: 0.13,
    status: 'NORMAL',
    assignedVehicleId: null,
    assignedStopNumber: null,
  },
  {
    id: 'BIN-115',
    name: 'Thùng rác Cầu Calmette',
    address: 'Đoàn Văn Bơ - Bến Vân Đồn, Q.4',
    lat: 10.7672,
    lng: 106.7025,
    capacityKg: 140,
    currentFillPercent: 50,
    fillRate: 0.11,
    status: 'NORMAL',
    assignedVehicleId: null,
    assignedStopNumber: null,
  },
  {
    id: 'BIN-116',
    name: 'Thùng rác Cảng Khánh Hội',
    address: 'Hoàng Diệu, Phường 12, Quận 4',
    lat: 10.7585,
    lng: 106.7065,
    capacityKg: 150,
    currentFillPercent: 81, // Đã đầy cần gom
    fillRate: 0.13,
    status: 'OVERFLOW',
    assignedVehicleId: null,
    assignedStopNumber: null,
  },
];

// Danh sách 6 xe thu gom phân bổ thưa theo 6 phân vùng địa lý riêng biệt (Trung tâm, Nam Q.4, Tây Bắc Q.3, Bờ sông, Tây Nam, Đa Kao)
export const INITIAL_VEHICLES = [
  {
    vehicleId: 'VEH-01',
    driverName: 'Lê Văn Tài',
    driverId: 'DRV-01',
    maxCapacityKg: 1200,
    currentLoadKg: 150,
    lat: 10.7725,
    lng: 106.698,
    heading: 0,
    speedKmh: 45,
    status: 'IDLE', // 'IDLE' | 'MOVING_TO_BIN' | 'COLLECTING' | 'MOVING_TO_DEPOT' | 'UNLOADING'
    targetBinId: null,
    targetCoords: null,
    targetDepotId: null,
    targetDepotName: null,
    waypoints: [],
    roadPathCoordinates: [], // [[lng, lat], ...] bám sát mặt đường
    roadPathIndex: 0,
    color: '#0284c7', // Xanh dương - Tuyến Trung Tâm Bến Thành / Lê Lợi
    actionRemainingMs: 0,
    assignedBinsCount: 0,
  },
  {
    vehicleId: 'VEH-02',
    driverName: 'Trần Đình Trọng',
    driverId: 'DRV-02',
    maxCapacityKg: 1500,
    currentLoadKg: 200,
    lat: 10.763,
    lng: 106.701,
    heading: 90,
    speedKmh: 42,
    status: 'IDLE',
    targetBinId: null,
    targetCoords: null,
    targetDepotId: null,
    targetDepotName: null,
    waypoints: [],
    roadPathCoordinates: [],
    roadPathIndex: 0,
    color: '#059669', // Xanh lục - Tuyến Nam Sài Gòn & Quận 4
    actionRemainingMs: 0,
    assignedBinsCount: 0,
  },
  {
    vehicleId: 'VEH-03',
    driverName: 'Nguyễn Văn Hùng',
    driverId: 'DRV-03',
    maxCapacityKg: 1200,
    currentLoadKg: 100,
    lat: 10.7828,
    lng: 106.6958,
    heading: 180,
    speedKmh: 48,
    status: 'IDLE',
    targetBinId: null,
    targetCoords: null,
    targetDepotId: null,
    targetDepotName: null,
    waypoints: [],
    roadPathCoordinates: [],
    roadPathIndex: 0,
    color: '#d97706', // Vàng cam - Tuyến Tây Bắc Q.3 & Hồ Con Rùa
    actionRemainingMs: 0,
    assignedBinsCount: 0,
  },
  {
    vehicleId: 'VEH-04',
    driverName: 'Phạm Minh Đức',
    driverId: 'DRV-04',
    maxCapacityKg: 1400,
    currentLoadKg: 150,
    lat: 10.7745,
    lng: 106.707,
    heading: 270,
    speedKmh: 46,
    status: 'IDLE',
    targetBinId: null,
    targetCoords: null,
    targetDepotId: null,
    targetDepotName: null,
    waypoints: [],
    roadPathCoordinates: [],
    roadPathIndex: 0,
    color: '#7c3aed', // Tím đậm - Tuyến Bến Bạch Đằng & Bến Nghé (Bờ sông)
    actionRemainingMs: 0,
    assignedBinsCount: 0,
  },
  {
    vehicleId: 'VEH-05',
    driverName: 'Vũ Hoàng Long',
    driverId: 'DRV-05',
    maxCapacityKg: 1300,
    currentLoadKg: 120,
    lat: 10.766,
    lng: 106.692,
    heading: 45,
    speedKmh: 44,
    status: 'IDLE',
    targetBinId: null,
    targetCoords: null,
    targetDepotId: null,
    targetDepotName: null,
    waypoints: [],
    roadPathCoordinates: [],
    roadPathIndex: 0,
    color: '#0891b2', // Xanh mòng két - Tuyến Phố Tây Bùi Viện & Cầu Ông Lãnh
    actionRemainingMs: 0,
    assignedBinsCount: 0,
  },
  {
    vehicleId: 'VEH-06',
    driverName: 'Đặng Quốc Bảo',
    driverId: 'DRV-06',
    maxCapacityKg: 1200,
    currentLoadKg: 100,
    lat: 10.789,
    lng: 106.702,
    heading: 135,
    speedKmh: 46,
    status: 'IDLE',
    targetBinId: null,
    targetCoords: null,
    targetDepotId: null,
    targetDepotName: null,
    waypoints: [],
    roadPathCoordinates: [],
    roadPathIndex: 0,
    color: '#e11d48', // Hồng đỏ - Tuyến Đông Bắc Q.1 & Đa Kao / Thảo Cầm Viên
    actionRemainingMs: 0,
    assignedBinsCount: 0,
  },
];

export class WasteSimulationEngine {
  constructor() {
    this.bins = JSON.parse(JSON.stringify(INITIAL_BINS));
    this.vehicles = JSON.parse(JSON.stringify(INITIAL_VEHICLES));
    this.depots = JSON.parse(JSON.stringify(DEFAULT_DEPOTS));
    this.depot = { ...this.depots[0] }; // Giữ depot chính để tương thích
    this.overflowThreshold = 80; // % kích hoạt tự động gom
    this.speedMultiplier = 1;
    this.isRunning = false;
    this.autoDispatch = true;
    this.listeners = new Set();
    this.timerId = null;
    this.lastTickTime = null;
    this.isOptimizing = false;
    this.aiState = 'STANDBY'; // 'STANDBY' | 'OPTIMIZING' | 'WAITING_FLEET'
    this.isAiWaiting = false;

    // Báo cáo thuật toán tối ưu hóa tuyến đường gần nhất
    this.activeOptimizationReport = null;

    // Thống kê & Nhật ký sự kiện
    this.stats = {
      totalCollectedKg: 0,
      totalTripsCompleted: 0,
      totalAutoDispatches: 0,
      elapsedSeconds: 0,
      totalDistanceSavedKm: 0,
      totalCo2SavedKg: 0,
    };
    this.logs = [];

    // Chuỗi suy nghĩ & lập luận theo thời gian thực của AI (AI Chain-of-Thought Stream)
    this.aiThoughts = [];
    this.pendingDecision = null;
    this.lastDecisionTimestamp = Date.now();
    this.decisionCooldownMs = 35000; // Mỗi ~35s có thể phát sinh tình huống khó
    this.idleDurationSeconds = 0;

    this.initInitialAiThoughts();

    this.addLog(
      'INFO',
      '🚀 Khởi động Hệ thống Mô phỏng Thu gom Rác Thông minh AI & Bộ Điều Hướng Đường Bộ OSRM.',
    );
  }

  initInitialAiThoughts() {
    const timeStr = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    this.aiThoughts = [
      {
        id: 'thought-init-1',
        time: timeStr,
        stage: 'PERCEPTION',
        title: 'Khởi động Cảm biến IoT Giám sát Đô thị',
        detail:
          'Đã kết nối 24 trạm cảm biến siêu âm Quận 1 - Q.3 - Q.4. Phát hiện 6 điểm nóng vượt ngưỡng thu gom (BIN-103, BIN-105, BIN-110, BIN-114, BIN-118, BIN-122).',
        icon: '📡',
      },
      {
        id: 'thought-init-2',
        time: timeStr,
        stage: 'REASONING',
        title: 'Phân tích Ma trận Khoảng cách OSRM',
        detail:
          'Hệ thống đo lường khoảng cách mạng lưới giao thông thực tế giữa 6 xe và các điểm nóng để tránh tắc đường.',
        icon: '🧠',
      },
      {
        id: 'thought-init-3',
        time: timeStr,
        stage: 'OPTIMIZATION',
        title: 'Sẵn sàng Thuật toán 2-Opt TSP & CVRP Solver',
        detail:
          'Mô hình tối ưu hóa sức chứa đa xe sẵn sàng phân chia đồng đều khối lượng công việc cho toàn đội 6 xe.',
        icon: '⚡',
      },
    ];
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const snapshot = this.getStateSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  getStateSnapshot() {
    return {
      bins: [...this.bins],
      vehicles: [...this.vehicles],
      depots: [...this.depots],
      depot: { ...this.depot },
      isRunning: this.isRunning,
      speedMultiplier: this.speedMultiplier,
      autoDispatch: this.autoDispatch,
      overflowThreshold: this.overflowThreshold,
      aiState: this.aiState || 'STANDBY',
      isAiWaiting: this.isAiWaiting || false,
      isOptimizing: this.isOptimizing || false,
      stats: { ...this.stats },
      logs: [...this.logs],
      aiThoughts: [...this.aiThoughts],
      pendingDecision: this.pendingDecision ? { ...this.pendingDecision } : null,
      optimizationReport: this.activeOptimizationReport,
    };
  }

  /**
   * Tìm trạm dỡ rác gần nhất với một tọa độ cho trước (Nearest Depot)
   */
  getNearestDepot(lat, lng) {
    if (!this.depots || this.depots.length === 0) return this.depot;
    let nearest = this.depots[0];
    let minDist = Infinity;
    for (const d of this.depots) {
      const dist = calculateDistanceKm(lat, lng, d.lat, d.lng);
      if (dist < minDist) {
        minDist = dist;
        nearest = d;
      }
    }
    return nearest;
  }

  addThought(stage, title, detail, meta = {}) {
    const timeStr = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const entry = {
      id: `thought-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      time: timeStr,
      stage, // 'PERCEPTION' | 'REASONING' | 'OPTIMIZATION' | 'DECISION' | 'DEPOT' | 'HUMAN_INTERACTION'
      title,
      detail,
      vehicleId: meta.vehicleId || null,
      binId: meta.binId || null,
      icon: meta.icon || null,
    };
    this.aiThoughts.unshift(entry);
    if (this.aiThoughts.length > 50) {
      this.aiThoughts.pop();
    }
    this.notify();
  }

  triggerDifficultDecision(customType = null) {
    if (this.pendingDecision) return;

    const types = [
      'DISPUTED_EVIDENCE',
      'DEBT_VS_ENVIRONMENT',
      'OBSTRUCTED_ACCESS',
      'OFFLINE_SENSOR_BLINDSPOT',
      'CURFEW_VS_SLA',
      'BULKY_PRICE_DISPUTE',
    ];
    const selectedType = customType || types[Math.floor(Math.random() * types.length)];

    let decision;

    if (selectedType === 'DISPUTED_EVIDENCE') {
      const busyVeh = this.vehicles.find((v) => v.status !== 'IDLE') || this.vehicles[0];
      const checkBin = this.bins.find((b) => b.status === 'NORMAL') || this.bins[1];
      decision = {
        id: `DEC-${Date.now()}`,
        type: 'DISPUTED_EVIDENCE',
        severity: 'error',
        title: `Mâu thuẫn nghiệm thu: Thùng [${checkBin.id}] (${checkBin.name})`,
        situation: `Tài xế [${busyVeh.driverName}] gửi ảnh báo cáo đã dọn sạch thùng rác. Tuy nhiên, cảm biến siêu âm IoT sau 10 phút ổn định vẫn đo mức rác 86% (bất thường). Có nguy cơ tài xế chụp ảnh gian lận góc khuất HOẶC mắt đọc cảm biến bị bám bẩn sai lệch.`,
        aiRecommendation:
          'AI không thể phân định giữa gian lận hiện trường hay lỗi phần cứng cảm biến. Bắt buộc Điều phối viên thẩm định.',
        options: [
          {
            id: 'REJECT_AND_RECHECK',
            label: '📸 Bác bỏ nghiệm thu & Yêu cầu tài xế quay lại xác minh',
            description:
              'Tạm dừng đóng phiếu, yêu cầu tài xế quay lại quay video hiện trường xác nhận.',
            action: () => {
              checkBin.status = 'OVERFLOW';
              checkBin.currentFillPercent = 86;
              this.addThought(
                'HUMAN_INTERACTION',
                `Đã duyệt: Bác bỏ nghiệm thu thùng [${checkBin.id}], yêu cầu kiểm tra lại`,
                `Điều phối viên yêu cầu tài xế ${busyVeh.driverName} quay lại xác minh hiện trường do mâu thuẫn cảm biến.`,
                { binId: checkBin.id, icon: '📸' },
              );
            },
          },
          {
            id: 'APPROVE_EXCEPTION_FIX_SENSOR',
            label: '⚠️ Duyệt hoàn thành ngoại lệ & Tạo phiếu sửa cảm biến',
            description:
              'Tin tưởng báo cáo tài xế, phê duyệt hoàn thành phiếu và kích hoạt bảo trì IoT.',
            action: () => {
              checkBin.currentFillPercent = 0;
              this.addThought(
                'HUMAN_INTERACTION',
                `Đã duyệt ngoại lệ thùng [${checkBin.id}] & Kích hoạt sửa cảm biến`,
                `Điều phối viên chấp thuận ảnh nghiệm thu của tài xế. Tạo lệnh bảo trì kỹ thuật cho mắt đọc cảm biến siêu âm.`,
                { binId: checkBin.id, icon: '⚠️' },
              );
            },
          },
        ],
      };
    } else if (selectedType === 'DEBT_VS_ENVIRONMENT') {
      const debtBin =
        this.bins.find((b) => b.id === 'BIN-106' || b.id === 'BIN-108') || this.bins[3];
      decision = {
        id: `DEC-${Date.now()}`,
        type: 'DEBT_VS_ENVIRONMENT',
        severity: 'warning',
        title: `Xung đột pháp lý: Hộ nợ phí quá hạn nhưng rác tràn bốc mùi`,
        situation: `Hộ gia đình tại [${debtBin.name}] đang bị TẠM NGỪNG THU GOM theo quy định Trang 10 do nợ phí 3 tháng (D+14). Tuy nhiên, thùng rác hiện tại đã quá tải (${Math.round(debtBin.currentFillPercent || 92)}%), bốc mùi nồng nặc và bị các hộ lân cận phản ánh gay gắt.`,
        aiRecommendation:
          'Quy tắc tài chính yêu cầu ngưng phục vụ, nhưng quy tắc môi trường cảnh báo nguy cơ dịch bệnh. AI không có thẩm quyền pháp lý để tự phá vỡ quy định hợp đồng.',
        options: [
          {
            id: 'APPROVE_EMERGENCY_CLEANUP',
            label: '🛡️ Duyệt thu gom khẩn cấp (Tính phụ thu phạt kỳ sau)',
            description:
              'Ưu tiên bảo vệ vệ sinh môi trường khu dân cư, chuyển khoản thu phạt nợ vào bảng kê tháng sau.',
            action: () => {
              debtBin.status = 'OVERFLOW';
              this.runRouteOptimization();
              this.addThought(
                'HUMAN_INTERACTION',
                `Đã duyệt: Thu gom khẩn cấp thùng hộ nợ [${debtBin.id}] vì sức khỏe cộng đồng`,
                `Điều phối viên phê duyệt ngoại lệ thu gom để tránh ô nhiễm khu phố, ghi nhận phụ thu vào kỳ thanh toán tới.`,
                { binId: debtBin.id, icon: '🛡️' },
              );
            },
          },
          {
            id: 'ENFORCE_SUSPENSION',
            label: '⚖️ Giữ nguyên lệnh tạm ngừng & Chuyển Thanh tra Đô thị',
            description:
              'Tuân thủ nghiêm ngặt chế tài tài chính, chuyển Tổ kiểm tra phường xuống xử phạt hành chính.',
            action: () => {
              this.addThought(
                'HUMAN_INTERACTION',
                `Đã duyệt: Duy trì tạm ngừng dịch vụ thùng [${debtBin.id}]`,
                `Điều phối viên quyết định giữ nguyên chế tài ngừng dịch vụ, chuyển hồ sơ vi phạm sang Đội Trật tự Đô thị.`,
                { binId: debtBin.id, icon: '⚖️' },
              );
            },
          },
        ],
      };
    } else if (selectedType === 'OBSTRUCTED_ACCESS') {
      const alleyBin =
        this.bins.find((b) => b.id === 'BIN-105' || b.id === 'BIN-112') || this.bins[4];
      const assignedVeh = this.vehicles[0];
      decision = {
        id: `DEC-${Date.now()}`,
        type: 'OBSTRUCTED_ACCESS',
        severity: 'warning',
        title: `Chướng ngại vật hiện trường: Xe không thể tiếp cận [${alleyBin.id}]`,
        situation: `Tài xế [${assignedVeh.driverName}] báo cáo ngõ vào [${alleyBin.name}] đang bị rạp đám tiệc/vật liệu xây dựng chắn kín lối, xe tải thu gom không thể vào trong bán kính 150m.`,
        aiRecommendation:
          'Nếu dừng chờ sẽ làm trễ toàn bộ ca làm việc của các điểm phía sau; nếu bỏ qua thì rác sẽ tồn đọng gây phản cảm mỹ quan. AI cần Điều phối viên ra quyết định.',
        options: [
          {
            id: 'MANUAL_CART_PULL',
            label: '🚶 Chỉ đạo phụ xe đi bộ vào kéo thùng ra đường lớn',
            description: 'Tốn thêm khoảng 15-20 phút nhân lực nhưng giải phóng dứt điểm thùng rác.',
            action: () => {
              this.addThought(
                'HUMAN_INTERACTION',
                `Đã duyệt: Kéo bộ thủ công thùng [${alleyBin.id}] ra đường lớn`,
                `Điều phối viên chỉ đạo kíp xe hỗ trợ kéo bộ vượt chướng ngại vật để xử lý dứt điểm điểm rác.`,
                { binId: alleyBin.id, icon: '🚶' },
              );
            },
          },
          {
            id: 'SKIP_TO_NIGHT_SHIFT',
            label: '⏭️ Bỏ qua điểm này, chuyển phiếu vào ca đêm xe ba gác nhỏ',
            description:
              'Tiếp tục lộ trình cho các điểm còn lại, bàn giao điểm này cho xe gom hẻm ca đêm.',
            action: () => {
              alleyBin.status = 'NORMAL';
              alleyBin.assignedVehicleId = null;
              this.addThought(
                'HUMAN_INTERACTION',
                `Đã duyệt: Hoãn thu gom thùng [${alleyBin.id}], chuyển ca đêm`,
                `Điều phối viên ghi nhận ngoại lệ không thể tiếp cận, chuyển nhiệm vụ sang đội xe chuyên dụng ca đêm.`,
                { binId: alleyBin.id, icon: '⏭️' },
              );
            },
          },
        ],
      };
    } else if (selectedType === 'OFFLINE_SENSOR_BLINDSPOT') {
      const offlineBin =
        this.bins.find((b) => b.id === 'BIN-101' || b.id === 'BIN-103') || this.bins[0];
      decision = {
        id: `DEC-${Date.now()}`,
        type: 'OFFLINE_SENSOR_BLINDSPOT',
        severity: 'info',
        title: `Điểm mù IoT: Thùng mất kết nối tại khu vực lễ hội`,
        situation: `Thùng [${offlineBin.name}] mất sóng truyền dữ liệu IoT 32 giờ liên tục. Số đo lưu trữ cuối cùng là 65%. Khu vực này tối nay diễn ra sự kiện tập trung đông người.`,
        aiRecommendation:
          'Không có dữ liệu thực tế (Điểm mù). Nếu điều xe tới mà thùng rỗng thì lãng phí nhiên liệu; nếu không gom mà rác tràn thì ảnh hưởng nghiêm trọng đến hình ảnh đô thị.',
        options: [
          {
            id: 'DISPATCH_PREVENTIVE',
            label: '🚚 Điều xe ghé gom phòng ngừa rủi ro tràn rác',
            description:
              'Chấp nhận chi phí chuyến đi để đảm bảo không xảy ra sự cố rác tràn trong lễ hội.',
            action: () => {
              offlineBin.status = 'OVERFLOW';
              offlineBin.currentFillPercent = 88;
              this.runRouteOptimization();
              this.addThought(
                'HUMAN_INTERACTION',
                `Đã duyệt: Gom phòng ngừa thùng mất tín hiệu [${offlineBin.id}]`,
                `Điều phối viên quyết định cử xe thu gom phòng ngừa trước giờ cao điểm sự kiện đô thị.`,
                { binId: offlineBin.id, icon: '🚚' },
              );
            },
          },
          {
            id: 'WAIT_AND_INSPECT_HARDWARE',
            label: '📡 Giữ nguyên lịch định kỳ, cử kỹ thuật viên kiểm tra pin/mạng',
            description:
              'Tránh chạy xe không tải, chỉ cử nhân viên kỹ thuật đi kiểm tra thiết bị IoT.',
            action: () => {
              this.addThought(
                'HUMAN_INTERACTION',
                `Đã duyệt: Không điều xe gom thùng [${offlineBin.id}], kiểm tra thiết bị trước`,
                `Điều phối viên chỉ định kiểm tra phần cứng thiết bị, duy trì lịch gom định kỳ thông thường.`,
                { binId: offlineBin.id, icon: '📡' },
              );
            },
          },
        ],
      };
    } else if (selectedType === 'CURFEW_VS_SLA') {
      const lateVeh = this.vehicles[0];
      decision = {
        id: `DEC-${Date.now()}`,
        type: 'CURFEW_VS_SLA',
        severity: 'warning',
        title: `Xung đột: Sắp tới giờ cấm xe tải nội đô (06:00) vs Hạn xử lý SLA`,
        situation: `Xe [${lateVeh.vehicleId}] (${lateVeh.driverName}) còn 2 điểm gom cuối tại Quận 1. Chỉ còn 15 phút nữa là đến 06:00 sáng (giờ cấm xe tải vệ sinh cỡ lớn lưu thông trong nội đô). Nếu đi tiếp thì nguy cơ bị phạt vi phạm giao thông; nếu quay về ngay thì 2 điểm rác sẽ quá hạn cam kết (SLA).`,
        aiRecommendation:
          'Xung đột trực diện giữa Luật Giao thông và Chỉ tiêu Dịch vụ (SLA). AI bắt buộc chuyển Điều phối viên quyết định.',
        options: [
          {
            id: 'ORDER_RETURN_DEPOT',
            label: '🛑 Lệnh xe quay về Trạm dỡ rác ngay (Tránh phạt vi phạm)',
            description:
              'Bảo vệ an toàn phương tiện và tài xế, 2 điểm còn lại chuyển sang khung giờ cho phép.',
            action: () => {
              this.sendVehicleToDepot(lateVeh.vehicleId);
              this.addThought(
                'HUMAN_INTERACTION',
                `Đã duyệt: Rút xe [${lateVeh.vehicleId}] về bãi trước giờ cấm tải`,
                `Điều phối viên chỉ thị tuân thủ quy định giao thông đô thị, rút phương tiện về trạm trước 06:00.`,
                { vehicleId: lateVeh.vehicleId, icon: '🛑' },
              );
            },
          },
          {
            id: 'RUSH_CRITICAL_AND_EXIT',
            label: '⚡ Gom khẩn trương 1 điểm nóng nhất rồi thoát khỏi trung tâm',
            description:
              'Chấp nhận chạy sát giờ để giải phóng điểm rác đông du khách nhất rồi rời nội đô.',
            action: () => {
              this.addThought(
                'HUMAN_INTERACTION',
                `Đã duyệt: Gom gấp 1 điểm rác trọng yếu rồi rút nhanh khỏi nội đô`,
                `Điều phối viên chấp thuận gom nốt 1 điểm thiết yếu, yêu cầu lái xe di chuyển nhanh ra vành đai.`,
                { vehicleId: lateVeh.vehicleId, icon: '⚡' },
              );
            },
          },
        ],
      };
    } else {
      // BULKY_PRICE_DISPUTE
      decision = {
        id: `DEC-${Date.now()}`,
        type: 'BULKY_PRICE_DISPUTE',
        severity: 'error',
        title: `Sai lệch hiện trường: Đơn rác cồng kềnh khai báo sai khối lượng`,
        situation: `Đơn [ORD-BULKY-402] khách đặt trực tuyến khai báo là '1 bàn trà gỗ 15kg' (đã trả 90.000đ). Nhưng thực tế tại hiện trường là 'Bộ sofa salon gỗ lim nguyên khối ~130kg' ở tầng 3 không có thang máy. Khách hàng từ chối trả thêm phụ phí bốc xếp và dọa khiếu nại.`,
        aiRecommendation:
          'Mâu thuẫn giao dịch tài chính và an toàn lao động. Cần Điều phối viên can thiệp xử lý khiếu nại của công dân.',
        options: [
          {
            id: 'SUSPEND_AND_INVOICE_SURCHARGE',
            label: '⛔ Tạm dừng thu gom & Gửi biên bản yêu cầu phụ phí',
            description:
              'Bảo vệ sức khỏe tài xế, không bốc vác quá tải khi khách chưa thanh toán thêm 180.000đ.',
            action: () => {
              this.addThought(
                'HUMAN_INTERACTION',
                'Đã duyệt: Tạm dừng đơn cồng kềnh, yêu cầu bổ sung phụ phí tầng cao',
                'Điều phối viên bảo vệ an toàn lao động cho tài xế, gửi thông báo điều chỉnh giá có căn cứ tới ứng dụng cư dân.',
                { icon: '⛔' },
              );
            },
          },
          {
            id: 'DISPATCH_HELPER_AND_SETTLE_LATER',
            label: '🤝 Cử thêm 1 phụ xe hỗ trợ & Đối soát khiếu nại sau',
            description:
              'Ưu tiên hỗ trợ cư dân dọn sạch nhà, chuyển bộ phận chăm sóc khách hàng đối soát sau.',
            action: () => {
              this.addThought(
                'HUMAN_INTERACTION',
                'Đã duyệt: Cử nhân lực hỗ trợ thu gom, đối soát phí sau',
                'Điều phối viên điều động nhân lực phụ trợ giải phóng đồ cồng kềnh, chuyển hồ sơ sang bộ phận CSKH.',
                { icon: '🤝' },
              );
            },
          },
        ],
      };
    }

    this.pendingDecision = decision;
    this.lastDecisionTimestamp = Date.now();
    this.addThought(
      'HUMAN_INTERACTION',
      `🚨 [CẦN XÁC NHẬN] ${decision.title}`,
      `${decision.situation} ${decision.aiRecommendation}`,
      { icon: '🚨' },
    );
    this.notify();
  }

  /**
   * Kích hoạt sự cố SOS từ xe (Vehicle SOS Emergency):
   * Phân loại theo nghiệp vụ:
   * - SOS không khó xử lý (Sự cố xe hỏng máy, thủng lốp, tài xế xin hỗ trợ):
   *   AI tự động tính toán phương án tái lập tuyến theo Trang 03 PDF,
   *   chuyển giao các điểm chưa thu gom cho xe dự phòng và phát THÔNG BÁO XÉT DUYỆT cho Điều phối viên.
   * - SOS khó xử lý (Tai nạn giao thông nghiêm trọng, cháy nổ):
   *   Báo động đỏ toàn hệ thống, yêu cầu can thiệp cứu hộ khẩn cấp 114/115.
   */
  triggerVehicleSos(vehicleId, isComplex = false, customReason = null) {
    const vehicle = this.vehicles.find((v) => v.vehicleId === vehicleId);
    if (!vehicle) return;

    vehicle.isBroken = true;
    vehicle.status = 'BROKEN_SOS';

    // Thu thập các điểm thùng rác còn lại mà xe này chưa kịp gom
    const remainingBins = [];
    if (vehicle.targetBinId) {
      const currentTarget = this.bins.find((b) => b.id === vehicle.targetBinId);
      if (currentTarget && !remainingBins.some((rb) => rb.id === currentTarget.id)) {
        remainingBins.push(currentTarget);
      }
    }
    if (vehicle.waypoints && vehicle.waypoints.length > 0) {
      vehicle.waypoints.forEach((wp) => {
        const b = this.bins.find((bin) => bin.id === wp.binId);
        if (b && !remainingBins.some((rb) => rb.id === b.id)) {
          remainingBins.push(b);
        }
      });
    }

    // Dừng tuyến của xe gặp sự cố
    vehicle.targetBinId = null;
    vehicle.targetCoords = null;
    vehicle.waypoints = [];
    vehicle.roadPathCoordinates = [];
    vehicle.roadPathIndex = 0;

    // Tìm xe dự phòng để tiếp quản (ưu tiên xe IDLE không bị hỏng)
    const backupVehicle =
      this.vehicles.find((v) => v.vehicleId !== vehicleId && !v.isBroken && v.status === 'IDLE') ||
      this.vehicles.find((v) => v.vehicleId !== vehicleId && !v.isBroken);

    const reasonText = customReason || 'Sự cố hỏng hóc máy giữa chừng (Báo động SOS)';
    this.addLog(
      'ALERT',
      `🚨 [SOS KHẨN CẤP] Xe [${vehicle.vehicleId}] (${vehicle.driverName}) phát tín hiệu SOS: ${reasonText}. Còn ${remainingBins.length} điểm gom chưa hoàn thành!`,
    );

    if (isComplex) {
      // SOS Khó xử lý: Tai nạn nghiêm trọng, hỏa hoạn
      const decision = {
        id: `SOS-${Date.now()}`,
        type: 'VEHICLE_SOS_CRITICAL',
        severity: 'error',
        isSos: true,
        vehicleId: vehicle.vehicleId,
        title: `🚨 BÁO ĐỘNG ĐỎ: Xe [${vehicle.vehicleId}] gặp tai nạn / hỏa hoạn nghiêm trọng!`,
        situation: `Xe [${vehicle.vehicleId}] (${vehicle.driverName}) gửi tín hiệu SOS mức độ nguy cấp: Va chạm giao thông tại hiện trường. Phương tiện bị phong tỏa, không thể tiếp tục vận hành.`,
        aiRecommendation:
          'Sự cố vượt ngoài thẩm quyền tự động của AI. AI đề xuất lập tức gọi đường dây nóng Cứu hộ 114/115 và cử Đội phản ứng nhanh.',
        options: [
          {
            id: 'CALL_EMERGENCY_SERVICES',
            label: '🚑 Báo 114/115 & Cử Đội cứu hộ khẩn cấp',
            description: 'Ưu tiên sơ cấp cứu con người, phong tỏa hiện trường và xử lý cứu hộ.',
            action: () => {
              this.addThought(
                'HUMAN_INTERACTION',
                `Đã duyệt: Kích hoạt cứu hộ 114/115 cho xe [${vehicle.vehicleId}]`,
                `Điều phối viên đã kích hoạt quy trình ứng phó tai nạn khẩn cấp tại tọa độ [${vehicle.lat.toFixed(5)}, ${vehicle.lng.toFixed(5)}].`,
                { vehicleId: vehicle.vehicleId, icon: '🚑' },
              );
            },
          },
          {
            id: 'POSTPONE_POINTS',
            label: '⏸️ Tạm hoãn tuyến của xe này sang ca sau',
            description: 'Giải phóng các điểm rác chưa gom về hàng đợi.',
            action: () => {
              remainingBins.forEach((b) => {
                b.status = 'OVERFLOW';
                b.assignedVehicleId = null;
              });
              this.addThought(
                'HUMAN_INTERACTION',
                `Đã duyệt: Tạm hoãn tuyến xe [${vehicle.vehicleId}]`,
                `Đã hoàn trả các điểm rác về trạng thái chờ để xử lý hiện trường sự cố.`,
                { vehicleId: vehicle.vehicleId, icon: '⏸️' },
              );
            },
          },
        ],
      };
      this.pendingDecision = decision;
    } else {
      // SOS KHÔNG KHÓ XỬ LÝ (Sự cố xe hỏng máy, thủng lốp, tài xế xin hỗ trợ):
      // AI LẬP PHƯƠNG ÁN TÁI LẬP TUYẾN ĐỂ ĐIỀU PHỐI VIÊN XÉT DUYỆT (Trang 03 PDF)
      const remainingNames = remainingBins.map((b) => b.id).join(', ') || 'Không còn điểm tồn';
      const decision = {
        id: `SOS-${Date.now()}`,
        type: 'VEHICLE_SOS_OPERATIONAL',
        severity: 'error',
        isSos: true,
        vehicleId: vehicle.vehicleId,
        title: `🚨 [SOS CẦN XÉT DUYỆT] Xe [${vehicle.vehicleId}] gặp sự cố hỏng hóc giữa chừng`,
        situation: `Xe [${vehicle.vehicleId}] (${vehicle.driverName}) gửi tín hiệu SOS: ${reasonText}. Xe dừng an toàn tại hiện trường. Điểm đã gom giữ nguyên kết quả; còn ${remainingBins.length} điểm gom chưa hoàn thành (${remainingNames}).`,
        aiRecommendation: backupVehicle
          ? `Sự cố vận hành thông thường (không khó xử lý). AI đã tính toán phương án tái lập tuyến theo Trang 03 PDF: Đề xuất chuyển giao ${remainingBins.length} điểm rác còn lại sang xe dự phòng [${backupVehicle.vehicleId}] (${backupVehicle.driverName}) tiếp quản ngay lập tức.`
          : 'Sự cố vận hành thông thường. Hiện tại chưa có xe dự phòng rảnh rỗi. AI đề xuất tạm hoãn các điểm chưa gom sang ca kế tiếp.',
        options: [
          ...(backupVehicle
            ? [
                {
                  id: 'APPROVE_BACKUP_TAKEOVER',
                  label: `✅ Phê duyệt: Điều xe dự phòng [${backupVehicle.vehicleId}] tiếp quản tuyến`,
                  description: `Giữ nguyên các điểm xe [${vehicle.vehicleId}] đã gom xong. Lập tức điều xe [${backupVehicle.vehicleId}] di chuyển tới gom ${remainingBins.length} điểm còn lại (${remainingNames}).`,
                  action: async () => {
                    remainingBins.forEach((b) => {
                      b.assignedVehicleId = backupVehicle.vehicleId;
                    });
                    if (remainingBins.length > 0) {
                      const firstBin = remainingBins[0];
                      const otherBins = remainingBins.slice(1);
                      backupVehicle.waypoints = otherBins.map((b, idx) => ({
                        binId: b.id,
                        lat: b.lat,
                        lng: b.lng,
                        stopNumber: idx + 2,
                      }));
                      backupVehicle.status = 'MOVING_TO_BIN';
                      await this.setupVehicleRoadNavigation(
                        backupVehicle,
                        { lat: firstBin.lat, lng: firstBin.lng },
                        firstBin.id,
                        backupVehicle.waypoints,
                      );
                    }
                    this.addLog(
                      'AI',
                      `✅ [Điều Phối Viên Đã Duyệt] Xe dự phòng [${backupVehicle.vehicleId}] tiếp quản thành công ${remainingBins.length} điểm rác từ xe sự cố [${vehicle.vehicleId}].`,
                    );
                    this.addThought(
                      'HUMAN_INTERACTION',
                      `Đã duyệt: Xe [${backupVehicle.vehicleId}] tiếp quản tuyến xe sự cố [${vehicle.vehicleId}]`,
                      `Điều phối viên chấp thuận phương án của AI: Xe dự phòng [${backupVehicle.vehicleId}] đã nhận nhiệm vụ và đang di chuyển tới gom ${remainingBins.length} điểm rác còn lại.`,
                      { vehicleId: backupVehicle.vehicleId, icon: '✅' },
                    );
                  },
                },
              ]
            : []),
          {
            id: 'TOW_AND_POSTPONE',
            label: `🛠️ Duyệt: Cử xe cứu hộ & Chuyển ${remainingBins.length} điểm rác sang ca sau`,
            description: `Cứu hộ xe [${vehicle.vehicleId}] về xưởng. Hoàn trả các điểm rác chưa gom về hàng đợi thông thường.`,
            action: () => {
              remainingBins.forEach((b) => {
                b.status = 'OVERFLOW';
                b.assignedVehicleId = null;
              });
              this.addLog(
                'INFO',
                `🛠️ Đã phê duyệt lệnh cứu hộ xe [${vehicle.vehicleId}]. ${remainingBins.length} điểm rác được hoàn trả về hàng đợi.`,
              );
              this.addThought(
                'HUMAN_INTERACTION',
                `Đã duyệt: Kéo xe [${vehicle.vehicleId}] về xưởng & Hoãn điểm rác`,
                `Điều phối viên chỉ thị đưa xe về xưởng sửa chữa; ${remainingBins.length} điểm rác tồn đọng chuyển ca sau.`,
                { vehicleId: vehicle.vehicleId, icon: '🛠️' },
              );
            },
          },
        ],
      };
      this.pendingDecision = decision;
    }

    this.lastDecisionTimestamp = Date.now();
    this.addThought(
      'HUMAN_INTERACTION',
      `🚨 [SOS TỪ XE] ${this.pendingDecision.title}`,
      `${this.pendingDecision.situation} ${this.pendingDecision.aiRecommendation}`,
      { vehicleId: vehicle.vehicleId, icon: '🚨' },
    );
    this.notify();
  }

  resolveDecision(optionId) {
    if (!this.pendingDecision) return;
    const opt = this.pendingDecision.options.find((o) => o.id === optionId);
    if (opt && opt.action) {
      opt.action();
    }
    this.pendingDecision = null;
    this.lastDecisionTimestamp = Date.now();
    this.notify();
  }

  checkAndTriggerDifficultDecision() {
    if (this.pendingDecision || !this.isRunning) return;

    const now = Date.now();
    if (now - this.lastDecisionTimestamp < this.decisionCooldownMs) return;

    // Điều kiện 1: Có xe tải trọng cao (> 75%) và có thùng rác đang đầy
    const busyVeh = this.vehicles.find((v) => v.currentLoadKg / v.maxCapacityKg >= 0.75);
    const urgentBin = this.bins.find((b) => b.currentFillPercent >= 80 && !b.assignedVehicleId);

    if (busyVeh && urgentBin) {
      this.triggerDifficultDecision('OVERLOAD_RISK');
      return;
    }

    // Điều kiện 2: Có thùng rác đỏ (> 90%)
    const redBin = this.bins.find((b) => b.currentFillPercent >= 90);
    if (redBin) {
      this.triggerDifficultDecision('URGENT_PRIORITY');
      return;
    }

    // Điều kiện 3: Định kỳ sau 45s
    if (now - this.lastDecisionTimestamp > 45000) {
      this.triggerDifficultDecision();
    }
  }

  addLog(type, message) {
    const timeStr = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      time: timeStr,
      type, // 'INFO' | 'AI' | 'COLLECT' | 'ALERT' | 'DEPOT'
      message,
    };
    this.logs.unshift(entry);
    if (this.logs.length > 80) {
      this.logs.pop();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTickTime = Date.now();
    this.addLog('INFO', '▶️ Bắt đầu mô phỏng thời gian thực.');

    this.timerId = setInterval(() => {
      this.tick();
    }, 100); // 10 ticks / giây để chuyển động xe cực kỳ mượt mà
    this.notify();
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.addLog('INFO', '⏸️ Đã tạm dừng mô phỏng.');
    this.notify();
  }

  reset() {
    this.pause();
    this.bins = JSON.parse(JSON.stringify(INITIAL_BINS));
    this.vehicles = JSON.parse(JSON.stringify(INITIAL_VEHICLES));
    this.depots = JSON.parse(JSON.stringify(DEFAULT_DEPOTS));
    this.depot = { ...this.depots[0] };
    this.activeOptimizationReport = null;
    this.pendingDecision = null;
    this.lastDecisionTimestamp = Date.now();
    this.idleDurationSeconds = 0;
    this.stats = {
      totalCollectedKg: 0,
      totalTripsCompleted: 0,
      totalAutoDispatches: 0,
      elapsedSeconds: 0,
      totalDistanceSavedKm: 0,
      totalCo2SavedKg: 0,
    };
    this.logs = [];
    this.initInitialAiThoughts();
    this.addLog('INFO', '🔄 Đã làm mới hệ thống về trạng thái ban đầu.');
    this.start();
    this.notify();
  }

  setSpeed(multiplier) {
    this.speedMultiplier = multiplier;
    this.addLog('INFO', `⚡ Đã đổi tốc độ mô phỏng thành ${multiplier}x.`);
    this.notify();
  }

  setAutoDispatch(enabled) {
    this.autoDispatch = enabled;
    this.addLog(
      'INFO',
      enabled
        ? '🤖 Đã BẬT chế độ AI Tự Động Điều Phối Tuyến (2-Opt VRP).'
        : '✋ Đã TẮT chế độ AI Tự Động Điều Phối (Điều phối thủ công).',
    );
    this.notify();
  }

  setOverflowThreshold(val) {
    this.overflowThreshold = val;
    this.addLog('INFO', `🎯 Ngưỡng kích hoạt AI thu gom cập nhật: ${val}%.`);
    this.notify();
  }

  /**
   * Thêm thùng rác mới tại vị trí bất kỳ (khi người dùng click trên map)
   */
  addBinAtLocation({ lat, lng, name, capacityKg = 100, initialFill = 20, fillRate = 1.0 }) {
    const nextIdx = this.bins.length + 1;
    const newBinId = `BIN-${100 + nextIdx}`;
    const newBin = {
      id: newBinId,
      name: name || `Thùng rác mới #${nextIdx}`,
      address: `Tọa độ: [${lat.toFixed(5)}, ${lng.toFixed(5)}]`,
      lat,
      lng,
      capacityKg,
      currentFillPercent: initialFill,
      fillRate,
      status: initialFill >= this.overflowThreshold ? 'OVERFLOW' : 'NORMAL',
      assignedVehicleId: null,
      assignedStopNumber: null,
    };

    this.bins.push(newBin);
    this.addLog(
      'ALERT',
      `➕ Đã thêm thùng rác mới [${newBinId}] tại tọa độ [${lat.toFixed(4)}, ${lng.toFixed(4)}] (${initialFill}%).`,
    );
    this.notify();
    return newBin;
  }

  /**
   * Cập nhật mức rác thủ công cho thùng (để người dùng test nhanh)
   */
  setBinFillLevel(binId, fillPercent) {
    const bin = this.bins.find((b) => b.id === binId);
    if (bin) {
      bin.currentFillPercent = Math.max(0, Math.min(100, fillPercent));
      if (bin.currentFillPercent >= this.overflowThreshold) {
        bin.status = 'OVERFLOW';
      } else {
        bin.status = 'NORMAL';
      }
      this.addLog('INFO', `⚙️ Điều chỉnh [${bin.id}] về mức ${fillPercent}%.`);
      this.notify();
    }
  }

  /**
   * Xóa thùng rác
   */
  deleteBin(binId) {
    const binIdx = this.bins.findIndex((b) => b.id === binId);
    if (binIdx !== -1) {
      const removed = this.bins.splice(binIdx, 1)[0];
      // Nếu có xe đang hướng tới thùng này, hủy nhiệm vụ
      this.vehicles.forEach((v) => {
        if (v.targetBinId === binId) {
          v.status = 'IDLE';
          v.targetBinId = null;
          v.targetCoords = null;
          v.roadPathCoordinates = [];
          v.roadPathIndex = 0;
        }
      });
      this.addLog('INFO', `🗑️ Đã xóa thùng rác [${removed.id}].`);
      this.notify();
    }
  }

  /**
   * Kích hoạt ca gom rác tức thì (On-Demand Force Dispatch)
   * Xuất xe gom ngay các thùng rác có mức rác cao nhất trong thành phố mà không cần đợi tự đầy 80%
   */
  forceDispatchNow() {
    const idleVehicles = this.vehicles.filter((v) => !v.isBroken && v.status === 'IDLE');
    if (idleVehicles.length === 0) {
      this.addLog('INFO', '⚠️ Toàn bộ các xe đang bận làm nhiệm vụ, không thể kích hoạt ca mới.');
      return;
    }

    const availableBins = this.bins.filter(
      (b) => b.status !== 'COLLECTING' && !b.assignedVehicleId,
    );

    if (availableBins.length === 0) {
      this.addLog('INFO', '⚠️ Tất cả thùng rác đã được thu gom sạch hoặc đang được phân công.');
      return;
    }

    const targetCount = Math.min(availableBins.length, Math.max(4, idleVehicles.length * 2));
    const sorted = [...availableBins].sort((a, b) => b.currentFillPercent - a.currentFillPercent);
    const selected = sorted.slice(0, targetCount);

    selected.forEach((b) => {
      b.currentFillPercent = Math.max(82, b.currentFillPercent);
      b.status = 'OVERFLOW';
    });

    this.addLog(
      'AI',
      `🚀 [Kích hoạt ca gom] Điều phối viên xuất lệnh gom rác ngay! Điều động ${idleVehicles.length} xe xuất phát xử lý ${selected.length} điểm rác.`,
    );

    this.addThought(
      'PERCEPTION',
      'Điều phối viên kích hoạt lệnh xuất xe gom rác ngay',
      `Phân công ngay ${idleVehicles.length} xe rảnh rỗi gom ${selected.length} điểm rác có mức rác cao nhất trong thành phố.`,
      { icon: '🚀' },
    );

    this.notify();
    this.runRouteOptimization();
  }

  /**
   * Tạo tình huống phát sinh rác đột xuất (Cao điểm / Đầy nhanh)
   */
  triggerRandomOverflow(count = 2) {
    const availableBins = this.bins.filter(
      (b) =>
        b.currentFillPercent < this.overflowThreshold &&
        !b.assignedVehicleId &&
        b.status !== 'COLLECTING',
    );
    if (availableBins.length === 0) return;

    const sorted = [...availableBins].sort((a, b) => b.currentFillPercent - a.currentFillPercent);
    const selected = sorted.slice(0, count);

    selected.forEach((bin) => {
      bin.currentFillPercent = Math.floor(Math.random() * 12) + 85; // 85% - 97%
      bin.status = 'OVERFLOW';
    });

    this.addLog(
      'ALERT',
      `⚠️ [Giờ cao điểm] Phát sinh ${selected.length} điểm rác đầy mới: ${selected.map((b) => b.id).join(', ')}!`,
    );

    this.addThought(
      'PERCEPTION',
      `Phát sinh ${selected.length} điểm rác đầy mới`,
      `Cảm biến siêu âm ghi nhận lượng rác tăng vọt tại: ${selected.map((b) => b.name).join(', ')}. Chuyển sang hàng đợi VRP.`,
      { icon: '📡' },
    );

    this.notify();
    this.checkAndAutoDispatch();
  }

  /**
   * Điều chuyển xe về Trạm dỡ rác (Depot) ngay lập tức (mặc định chọn trạm gần nhất)
   */
  sendVehicleToDepot(vehicleId, depotId = null) {
    const vehicle = this.vehicles.find((v) => v.vehicleId === vehicleId);
    if (vehicle) {
      let targetDepot = null;
      if (depotId) {
        targetDepot = this.depots.find((d) => d.id === depotId);
      }
      if (!targetDepot) {
        targetDepot = this.getNearestDepot(vehicle.lat, vehicle.lng);
      }

      vehicle.status = 'MOVING_TO_DEPOT';
      vehicle.targetBinId = null;
      vehicle.targetDepotId = targetDepot.id;
      vehicle.targetDepotName = targetDepot.name;
      vehicle.waypoints = [];
      this.setupVehicleRoadNavigation(
        vehicle,
        { lat: targetDepot.lat, lng: targetDepot.lng },
        null,
        [],
      );
      this.addLog(
        'DEPOT',
        `🚨 Điều phối viên đã chỉ định xe [${vehicle.vehicleId}] quay về Trạm dỡ rác [${targetDepot.shortName || targetDepot.name}] ngay lập tức!`,
      );
      this.notify();
    }
  }

  /**
   * Gán đường đi thực tế trên mạng lưới giao thông (Road Coordinates) cho xe
   */
  async setupVehicleRoadNavigation(vehicle, destinationCoords, destinationBinId, waypoints = []) {
    vehicle.targetBinId = destinationBinId;
    vehicle.targetCoords = destinationCoords;
    vehicle.waypoints = waypoints;

    // 1. Kiểm tra và gán ngay tọa độ đường bộ từ Cache hoặc bộ nội suy đường phố
    // Đảm bảo xe luôn luôn chạy trên mặt đường, tuyệt đối KHÔNG bao giờ chạy theo đường chim bay
    const immediateCoords = roadRoutingService.getRoadCoordinatesSync(
      vehicle.lng,
      vehicle.lat,
      destinationCoords.lng,
      destinationCoords.lat,
    );

    vehicle.roadPathIndex = 0;
    vehicle.roadPathCoordinates =
      immediateCoords && immediateCoords.length > 1
        ? immediateCoords
        : [
            [vehicle.lng, vehicle.lat],
            [destinationCoords.lng, destinationCoords.lat],
          ];

    if (vehicle.roadPathCoordinates.length >= 2) {
      vehicle.heading = calculateBearing(
        vehicle.roadPathCoordinates[0][1],
        vehicle.roadPathCoordinates[0][0],
        vehicle.roadPathCoordinates[1][1],
        vehicle.roadPathCoordinates[1][0],
      );
    }

    // 2. Tiếp tục hoàn thiện tọa độ đường bộ chính xác cao qua OSRM (nếu có khúc quanh mới)
    const points = [
      [vehicle.lng, vehicle.lat],
      [destinationCoords.lng, destinationCoords.lat],
    ];

    try {
      const roadData = await roadRoutingService.fetchMultiStopRoute(points);
      if (
        vehicle.targetCoords &&
        vehicle.targetCoords.lat === destinationCoords.lat &&
        vehicle.targetCoords.lng === destinationCoords.lng &&
        roadData &&
        roadData.coordinates &&
        roadData.coordinates.length > 1
      ) {
        // Nếu xe đang di chuyển về Trạm dỡ rác Depot, đảm bảo điểm cuối nối thẳng vào cổng Depot
        if (!destinationBinId && vehicle.status === 'MOVING_TO_DEPOT') {
          const lastPoint = roadData.coordinates[roadData.coordinates.length - 1];
          const distToDepot = calculateDistanceKm(
            lastPoint[1],
            lastPoint[0],
            destinationCoords.lat,
            destinationCoords.lng,
          );
          if (distToDepot > 0.005) {
            roadData.coordinates.push([destinationCoords.lng, destinationCoords.lat]);
          }
        }

        vehicle.roadPathCoordinates = roadData.coordinates;
        vehicle.roadPathIndex = 0;

        // Xoay đầu xe ngay theo đoạn đường đầu tiên
        if (roadData.coordinates.length >= 2) {
          vehicle.heading = calculateBearing(
            roadData.coordinates[0][1],
            roadData.coordinates[0][0],
            roadData.coordinates[1][1],
            roadData.coordinates[1][0],
          );
        }
      }
    } catch {
      // Đã có fallback đường thẳng
    }

    this.notify();
  }

  /**
   * KÍCH HOẠT THUẬT TOÁN TỐI ƯU HÓA TUYẾN ĐƯỜNG (2-Opt TSP & CVRP SOLVER)
   * Tối ưu hóa toàn bộ các thùng rác đang đầy hoặc cần thu gom
   */
  async runRouteOptimization() {
    if (this.isOptimizing) return;
    this.isOptimizing = true;
    this.aiState = 'OPTIMIZING';
    this.isAiWaiting = false;

    try {
      // 1. Tìm các thùng rác cần gom (>= threshold hoặc được chỉ định)
      let targetBins = this.bins.filter(
        (b) => b.currentFillPercent >= this.overflowThreshold || b.status === 'OVERFLOW',
      );

      // Nếu số lượng thùng rác đầy ít hơn số xe, bổ sung thêm các thùng có lượng rác cao
      // để phân bổ đều đặn cho toàn bộ các xe trong đội cùng hoạt động
      if (targetBins.length < this.vehicles.length) {
        const remainingBins = this.bins
          .filter((b) => !targetBins.some((tb) => tb.id === b.id) && b.status !== 'COLLECTING')
          .sort((a, b) => b.currentFillPercent - a.currentFillPercent);

        const needed = Math.min(this.bins.length, Math.max(4, this.vehicles.length * 2));
        const additional = remainingBins.slice(0, needed - targetBins.length);
        additional.forEach((b) => {
          b.currentFillPercent = Math.max(65, b.currentFillPercent);
          b.status = 'OVERFLOW';
        });
        targetBins = [...targetBins, ...additional];
      }

      // Biến đổi sang định dạng Ticket
      const tickets = targetBins.map((bin) => ({
        id: `TCK-${bin.id}`,
        binId: bin.id,
        lat: bin.lat,
        lng: bin.lng,
        address: bin.address,
        estimatedKg: Math.round((bin.currentFillPercent / 100) * bin.capacityKg),
      }));

      // 2. Chạy thuật toán CVRP + 2-Opt TSP Solver
      // Chỉ phân công tuyến mới cho các xe rảnh rỗi hoặc đang thu gom thông thường.
      // Tuyệt đối không giao việc mới cho xe đang trên đường về Depot (MOVING_TO_DEPOT)
      // hoặc đang dỡ rác (UNLOADING) để xe bắt buộc phải về trạm xả rác xong mới được nhận nhiệm vụ mới!
      const availableVehicles = this.vehicles
        .filter(
          (v) =>
            !v.isBroken &&
            v.status !== 'MOVING_TO_DEPOT' &&
            v.status !== 'UNLOADING' &&
            v.status !== 'BROKEN_SOS',
        )
        .map((v) => ({
          vehicleId: v.vehicleId,
          driverId: v.driverId,
          driverName: v.driverName,
          maxCapacityKg: v.maxCapacityKg,
          currentCapacityKg: v.currentLoadKg,
          lat: v.lat,
          lng: v.lng,
        }));

      if (availableVehicles.length === 0) {
        return;
      }

      this.addThought(
        'REASONING',
        'Phân tích Ma trận khoảng cách & Tải trọng xe',
        `Đang lập kế hoạch gom ${tickets.length} điểm rác với ${availableVehicles.length} xe hoạt động. Ràng buộc: Sức chứa tối đa ${availableVehicles[0]?.maxCapacityKg || 2000} kg/xe.`,
        { icon: '🧠' },
      );

      const plan = RouteOptimizationService.optimizeRoutes({
        tickets,
        vehicles: availableVehicles,
        unloadingStation: {
          name: this.depot.name,
          lat: this.depot.lat,
          lng: this.depot.lng,
        },
        unloadingStations: this.depots,
      });

      // 3. Làm giàu dữ liệu tọa độ đa giác đường bộ OSRM (Road Geometry)
      const enrichedPlan = await RouteOptimizationService.enrichPlanWithRoadGeometry(plan);
      this.activeOptimizationReport = enrichedPlan;

      // Cập nhật số liệu tiết kiệm toàn cục
      if (enrichedPlan.metrics) {
        this.stats.totalDistanceSavedKm += enrichedPlan.metrics.totalDistanceSavedKm;
        this.stats.totalCo2SavedKg += enrichedPlan.metrics.totalCo2SavedKg;
      }

      // 4. Áp dụng kế hoạch tối ưu trực tiếp vào đội xe mô phỏng
      enrichedPlan.vehicleRoutes.forEach((vRoute) => {
        const vehicle = this.vehicles.find((v) => v.vehicleId === vRoute.vehicleId);
        if (!vehicle || vRoute.stops.length === 0) return;

        // Bảo vệ trạng thái: Không ghi đè nếu xe đang di chuyển về Depot hoặc đang xả rác
        if (vehicle.status === 'MOVING_TO_DEPOT' || vehicle.status === 'UNLOADING') return;

        vehicle.targetDepotId = vRoute.targetDepotId || null;
        vehicle.targetDepotName = vRoute.targetDepotName || null;
        vehicle.assignedDepot = vRoute.unloadingStation || null;

        const firstStop = vRoute.stops[0];
        const remainingStops = vRoute.stops.slice(1).map((s) => ({
          lat: s.lat,
          lng: s.lng,
          binId: s.binId,
        }));

        // Gán số thứ tự điểm dừng tối ưu lên thùng rác
        vRoute.stops.forEach((s) => {
          const bin = this.bins.find((b) => b.id === s.binId);
          if (bin) {
            bin.assignedVehicleId = vehicle.vehicleId;
            bin.assignedStopNumber = s.stopIndex;
            bin.status = 'ASSIGNED';
          }
        });

        vehicle.status = 'MOVING_TO_BIN';
        vehicle.assignedBinsCount = vRoute.stops.length;
        vehicle.totalPlannedStops = vRoute.stops.length;
        vehicle.plannedRoadGeometry = vRoute.roadGeometry || [];

        // Điều hướng xe tới điểm dừng đầu tiên (firstStop), các điểm còn lại lưu trong waypoints
        this.setupVehicleRoadNavigation(
          vehicle,
          { lat: firstStop.lat, lng: firstStop.lng },
          firstStop.binId,
          remainingStops,
        );
      });

      this.stats.totalAutoDispatches += enrichedPlan.assignedStopsCount;

      this.addLog(
        'AI',
        `🧠 [2-Opt VRP] Đã tối ưu hóa toàn bộ quy trình: Tiết kiệm ${enrichedPlan.metrics.totalDistanceSavedKm} km (-${enrichedPlan.metrics.overallSavingsPercent}%), giảm ${enrichedPlan.metrics.totalCo2SavedKg} kg CO₂! Phân bổ ${enrichedPlan.assignedStopsCount} điểm dừng cho đội xe.`,
      );

      this.addThought(
        'OPTIMIZATION',
        'Hoàn tất giải thuật 2-Opt TSP & CVRP Solver',
        `Đã tối ưu hóa tuyến đường: Tiết kiệm ${enrichedPlan.metrics.totalDistanceSavedKm} km (-${enrichedPlan.metrics.overallSavingsPercent}%), cắt giảm ${enrichedPlan.metrics.totalCo2SavedKg} kg CO₂.`,
        { icon: '⚡' },
      );

      // AI tính toán xong toàn bộ quy trình -> Chuyển sang chế độ NGHỈ ĐỢI các xe chạy xong
      this.aiState = 'WAITING_FLEET';
      this.isAiWaiting = true;

      this.addThought(
        'DECISION',
        `AI hoàn tất lập tuyến toàn bộ -> Nghỉ đợi đội xe (${availableVehicles.length} xe)`,
        `Đã phân bổ toàn bộ lộ trình khép kín (Xe -> Các điểm gom -> Về trạm dỡ rác). AI chuyển sang chế độ NGHỈ ĐỢI để các xe hoàn tất quy trình.`,
        { icon: '☕' },
      );

      this.addLog(
        'AI',
        `☕ [AI Nghỉ Đợi] Đã phân bổ toàn bộ lộ trình cho đội xe. AI tạm nghỉ đợi cho tới khi các xe chạy xong toàn bộ quy trình.`,
      );

      this.notify();
    } catch (err) {
      console.error('Error during route optimization:', err);
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * Thuật toán AI Tự động kiểm tra và kích hoạt điều phối tối ưu
   * Quy tắc:
   * - Hỗ trợ Điều phối động (Dynamic Continuous Dispatch): Khi có xe rảnh (IDLE) và có thùng rác mới đầy,
   *   AI lập tức giao việc ngay cho xe rảnh mà không cần đợi cả đội chạy xong.
   * - Khi các xe đang di chuyển, AI chuyển sang chế độ Giám sát hành trình (Active Fleet Monitoring).
   */
  checkAndAutoDispatch(deltaSeconds = 0) {
    if (!this.autoDispatch || this.isOptimizing) return;

    // 1. Kiểm tra các xe đang chạy thực hiện nhiệm vụ
    const activeVehicles = this.vehicles.filter(
      (v) =>
        !v.isBroken &&
        (v.status === 'MOVING_TO_BIN' ||
          v.status === 'COLLECTING' ||
          v.status === 'MOVING_TO_DEPOT' ||
          v.status === 'UNLOADING'),
    );

    const idleVehicles = this.vehicles.filter((v) => !v.isBroken && v.status === 'IDLE');

    // 2. Tìm các thùng rác vượt ngưỡng chưa được phân công xe nào
    const urgentBins = this.bins.filter(
      (b) =>
        (b.currentFillPercent >= this.overflowThreshold || b.status === 'OVERFLOW') &&
        b.status !== 'COLLECTING' &&
        !b.assignedVehicleId,
    );

    // 3. ĐIỀU PHỐI ĐỘNG LIÊN TỤC:
    // Nếu có xe rảnh và có thùng rác đầy mới -> AI lập tức kích hoạt chu kỳ điều phối cho các xe rảnh!
    if (idleVehicles.length > 0 && urgentBins.length > 0) {
      this.idleDurationSeconds = 0;
      this.isAiWaiting = false;
      this.aiState = 'OPTIMIZING';
      this.addLog(
        'AI',
        `⚡ [Điều phối liên tục] Phát hiện ${idleVehicles.length} xe rảnh và ${urgentBins.length} thùng rác đầy mới (${urgentBins.map((b) => b.id).join(', ')}). AI lập tức kích hoạt điều phối tiếp ứng!`,
      );
      this.addThought(
        'PERCEPTION',
        'Điều phối động: Phân công xe rảnh gom thùng mới',
        `Có ${idleVehicles.length} xe rảnh sẵn sàng tiếp nhận ${urgentBins.length} điểm rác vượt ngưỡng. AI tiến hành giải thuật toán tối ưu hóa tuyến ngay.`,
        { icon: '🚀' },
      );
      this.runRouteOptimization();
      return;
    }

    // 4. Nếu vẫn còn xe đang chạy ngoài đường -> AI ở chế độ Giám sát hành trình thời gian thực
    if (activeVehicles.length > 0) {
      this.idleDurationSeconds = 0;
      if (this.aiState !== 'WAITING_FLEET') {
        this.isAiWaiting = true;
        this.aiState = 'WAITING_FLEET';
      }
      return;
    }

    // 5. Toàn đội xe đã hoàn tất về IDLE và không có thùng nào quá tải
    if (this.aiState !== 'STANDBY') {
      this.isAiWaiting = true;
      this.aiState = 'STANDBY';
    }

    // Tự động mô phỏng phát sinh rác giờ cao điểm sau khi toàn đội xe nghỉ khoảng 18s
    // giúp chu trình mô phỏng luôn sinh động, không bị ngưng trệ 10-15 phút do chờ rác tự đầy
    this.idleDurationSeconds = (this.idleDurationSeconds || 0) + deltaSeconds;
    if (this.idleDurationSeconds >= 18) {
      this.idleDurationSeconds = 0;
      this.triggerRandomOverflow(Math.min(3, Math.max(2, Math.floor(idleVehicles.length / 2))));
    }
  }

  /**
   * Chu kỳ tính toán chính (Tick Loop)
   */
  tick() {
    const now = Date.now();
    const deltaMs = (now - (this.lastTickTime || now)) * this.speedMultiplier;
    this.lastTickTime = now;

    const deltaSeconds = deltaMs / 1000;
    this.stats.elapsedSeconds += deltaSeconds;

    // 1. Tăng mức rác trong các thùng theo tốc độ fillRate
    this.bins.forEach((bin) => {
      if (bin.status !== 'COLLECTING') {
        const increment = bin.fillRate * deltaSeconds;
        bin.currentFillPercent = Math.min(100, bin.currentFillPercent + increment);

        if (bin.currentFillPercent >= this.overflowThreshold && bin.status === 'NORMAL') {
          bin.status = 'OVERFLOW';
          this.addLog(
            'ALERT',
            `⚠️ CẢNH BÁO: Thùng [${bin.id}] (${bin.name}) đã đạt ${Math.round(bin.currentFillPercent)}% (vượt ngưỡng ${this.overflowThreshold}%)!`,
          );
          this.addThought(
            'PERCEPTION',
            `Phát hiện thùng rác đầy [${bin.id}]`,
            `Cảm biến siêu âm báo mức rác ${Math.round(bin.currentFillPercent)}% tại ${bin.name} (${bin.address}). Đã chuyển vào hàng đợi ưu tiên VRP.`,
            { binId: bin.id, icon: '📡' },
          );
        }
      }
    });

    // 2. Kích hoạt AI Điều phối
    this.checkAndAutoDispatch(deltaSeconds);

    // 2.1 Kiểm tra và kích hoạt tình huống khó nếu đủ điều kiện
    this.checkAndTriggerDifficultDecision();

    // 3. Cập nhật vị trí và trạng thái của các xe di chuyển BÁM THEO ĐƯỜNG BỘ
    this.vehicles.forEach((vehicle) => {
      if (vehicle.isBroken) return;

      // 3.1 Xe đang di chuyển tới thùng rác
      if (vehicle.status === 'MOVING_TO_BIN' && vehicle.targetCoords) {
        const distKm = calculateDistanceKm(
          vehicle.lat,
          vehicle.lng,
          vehicle.targetCoords.lat,
          vehicle.targetCoords.lng,
        );

        const handleArrivalAtBin = () => {
          vehicle.status = 'COLLECTING';
          vehicle.actionRemainingMs = 1500 / this.speedMultiplier;

          const targetBin = this.bins.find((b) => b.id === vehicle.targetBinId);
          if (targetBin) {
            targetBin.status = 'COLLECTING';
            vehicle.lat = targetBin.lat;
            vehicle.lng = targetBin.lng;

            // TĂNG KÝ NGAY LẬP TỨC KHI XE TỚI BỐC DỠ: Đảm bảo số ký luôn tăng rõ ràng
            const fillPct = Math.max(15, targetBin.currentFillPercent);
            const collectedWeight = Math.max(
              30,
              Math.round((fillPct / 100) * (targetBin.capacityKg || 100)),
            );

            vehicle.currentLoadKg = Math.min(
              vehicle.maxCapacityKg,
              vehicle.currentLoadKg + collectedWeight,
            );
            this.stats.totalCollectedKg += collectedWeight;

            // Đưa mức rác trong thùng về 0%
            targetBin.currentFillPercent = 0;

            this.addLog(
              'COLLECT',
              `🚚 Xe [${vehicle.vehicleId}] đã tới [${targetBin.id}], nâng thùng bốc dỡ (+${collectedWeight} kg). Tải trọng: ${Math.round(vehicle.currentLoadKg)}/${vehicle.maxCapacityKg} kg.`,
            );

            this.addThought(
              'PERCEPTION',
              `Xe [${vehicle.vehicleId}] tiếp cận [${targetBin.id}]`,
              `Đã tới vị trí ${targetBin.name}. Nâng thùng nạp +${collectedWeight} kg rác. Tải trọng xe hiện tại: ${Math.round(vehicle.currentLoadKg)}/${vehicle.maxCapacityKg} kg.`,
              { vehicleId: vehicle.vehicleId, binId: targetBin.id, icon: '🚚' },
            );
          }
        };

        if (distKm <= 0.02) {
          handleArrivalAtBin();
        } else {
          this.moveVehicleAlongRoadPath(vehicle, deltaSeconds, handleArrivalAtBin);
        }
      }

      // 3.2 Xe đang thu gom tại chỗ
      else if (vehicle.status === 'COLLECTING') {
        vehicle.actionRemainingMs -= deltaMs;
        if (vehicle.actionRemainingMs <= 0) {
          const targetBin = this.bins.find((b) => b.id === vehicle.targetBinId);
          if (targetBin) {
            targetBin.status = 'NORMAL';
            targetBin.assignedVehicleId = null;
            targetBin.assignedStopNumber = null;
          }

          // Quyết định bước tiếp theo:
          const loadRatio = vehicle.currentLoadKg / vehicle.maxCapacityKg;

          // QUY TẮC NGHIỆM THU: Xe chỉ đi đổ rác tại Depot khi tải trọng THỰC SỰ ĐẦY / GẦN ĐẦY (>= 75%)
          // Tuyệt đối không cho xe chở mới 10-20% tải chạy đi đổ rác làm lãng phí nhiên liệu và nhân lực!
          const isTruckFull = loadRatio >= 0.75;

          if (isTruckFull) {
            // Chọn trạm dỡ rác gần nhất với vị trí hiện tại của xe
            const targetDepot =
              (vehicle.targetDepotId && this.depots.find((d) => d.id === vehicle.targetDepotId)) ||
              this.getNearestDepot(vehicle.lat, vehicle.lng);

            vehicle.status = 'MOVING_TO_DEPOT';
            vehicle.targetBinId = null;
            vehicle.targetDepotId = targetDepot.id;
            vehicle.targetDepotName = targetDepot.name;
            vehicle.waypoints = [];
            this.setupVehicleRoadNavigation(
              vehicle,
              { lat: targetDepot.lat, lng: targetDepot.lng },
              null,
              [],
            );
            this.addLog(
              'DEPOT',
              `🚨 Xe [${vehicle.vehicleId}] ĐÃ ĐẦY TẢI (${Math.round(vehicle.currentLoadKg)}/${vehicle.maxCapacityKg} kg - ${Math.round(loadRatio * 100)}% sức chứa) đang di chuyển về [${targetDepot.shortName || targetDepot.name}] để xả rác.`,
            );
            this.addThought(
              'DEPOT',
              `Xe [${vehicle.vehicleId}] đầy tải (${Math.round(loadRatio * 100)}%) -> Di chuyển về Depot`,
              `Tải trọng đạt ${Math.round(vehicle.currentLoadKg)}/${vehicle.maxCapacityKg} kg (>= 75% sức chứa định mức). AI điều phối xe về [${targetDepot.shortName || targetDepot.name}] để xả rác.`,
              { vehicleId: vehicle.vehicleId, icon: '♻️' },
            );
          } else if (vehicle.waypoints && vehicle.waypoints.length > 0) {
            const nextWaypoint = vehicle.waypoints.shift();
            vehicle.status = 'MOVING_TO_BIN';
            this.setupVehicleRoadNavigation(
              vehicle,
              nextWaypoint,
              nextWaypoint.binId,
              vehicle.waypoints,
            );
            this.addLog(
              'INFO',
              `📍 Xe [${vehicle.vehicleId}] (tải ${Math.round(loadRatio * 100)}%) tiếp tục di chuyển trên đường tới điểm [${nextWaypoint.binId}]. Còn ${vehicle.waypoints.length} điểm trước khi về Trạm dỡ rác.`,
            );
            this.addThought(
              'DECISION',
              `Xe [${vehicle.vehicleId}] tiếp tục tới điểm [${nextWaypoint.binId}]`,
              `Theo thứ tự tối ưu 2-Opt, xe di chuyển bám theo bản đồ giao thông tới điểm gom tiếp theo. Còn ${vehicle.waypoints.length} điểm trước khi về Trạm dỡ rác.`,
              { vehicleId: vehicle.vehicleId, binId: nextWaypoint.binId, icon: '📍' },
            );
          } else {
            // ĐÃ THU GOM XONG TẤT CẢ CÁC THÙNG TRONG LỘ TRÌNH ĐƯỢC GIAO (HẾT WAYPOINTS):
            // Chuyển sang chặng cuối cùng: Di chuyển về Trạm dỡ rác Depot để xả rác và hoàn tất quy trình
            const targetDepot =
              (vehicle.targetDepotId && this.depots.find((d) => d.id === vehicle.targetDepotId)) ||
              vehicle.assignedDepot ||
              this.getNearestDepot(vehicle.lat, vehicle.lng);

            vehicle.status = 'MOVING_TO_DEPOT';
            vehicle.targetBinId = null;
            vehicle.targetDepotId = targetDepot.id;
            vehicle.targetDepotName = targetDepot.name;
            vehicle.waypoints = [];
            this.setupVehicleRoadNavigation(
              vehicle,
              { lat: targetDepot.lat, lng: targetDepot.lng },
              null,
              [],
            );
            this.addLog(
              'DEPOT',
              `🏁 Xe [${vehicle.vehicleId}] (${vehicle.driverName}) đã hoàn tất thu gom toàn bộ các điểm được giao (${Math.round(vehicle.currentLoadKg)} kg rác). Đang di chuyển về [${targetDepot.shortName || targetDepot.name}] để xả rác và hoàn tất quy trình!`,
            );
            this.addThought(
              'DEPOT',
              `Xe [${vehicle.vehicleId}] hoàn thành lộ trình gom -> Về Depot xả rác`,
              `Đã thu gom xong toàn bộ các điểm trong tuyến đường tối ưu. Xe đang di chuyển về Trạm dỡ rác [${targetDepot.shortName || targetDepot.name}] để xả rác và kết thúc quy trình.`,
              { vehicleId: vehicle.vehicleId, icon: '🏁' },
            );
          }
        }
      }

      // 3.3 Xe đang di chuyển về Trạm dỡ rác
      else if (vehicle.status === 'MOVING_TO_DEPOT' && vehicle.targetCoords) {
        const targetDepot =
          (vehicle.targetDepotId && this.depots.find((d) => d.id === vehicle.targetDepotId)) ||
          this.getNearestDepot(vehicle.lat, vehicle.lng);

        const distDepotKm = calculateDistanceKm(
          vehicle.lat,
          vehicle.lng,
          targetDepot.lat,
          targetDepot.lng,
        );

        const handleArriveAtDepot = () => {
          vehicle.status = 'UNLOADING';
          vehicle.actionRemainingMs = 1800 / this.speedMultiplier;
          vehicle.lat = targetDepot.lat;
          vehicle.lng = targetDepot.lng;
          vehicle.roadPathCoordinates = [];
          vehicle.roadPathIndex = 0;
          this.addLog(
            'DEPOT',
            `♻️ Xe [${vehicle.vehicleId}] (${vehicle.driverName}) đã về tới [${targetDepot.shortName || targetDepot.name}], đang ép dỡ ${Math.round(vehicle.currentLoadKg)} kg rác vào hầm chứa...`,
          );
          this.addThought(
            'DEPOT',
            `Xe [${vehicle.vehicleId}] cập bến [${targetDepot.shortName || targetDepot.name}]`,
            `Đã về tới trạm dỡ rác. Bắt đầu quy trình ép dỡ ${Math.round(vehicle.currentLoadKg)} kg rác vào hầm trung tâm.`,
            { vehicleId: vehicle.vehicleId, icon: '♻️' },
          );
        };

        // Chỉ khi xe ĐÃ THỰC SỰ TIẾP CẬN TRẠM DEPOT (khoảng cách <= 35m) mới được chuyển sang xả rác
        if (distDepotKm <= 0.035) {
          handleArriveAtDepot();
        } else {
          this.moveVehicleAlongRoadPath(vehicle, deltaSeconds, () => {
            const currentDist = calculateDistanceKm(
              vehicle.lat,
              vehicle.lng,
              targetDepot.lat,
              targetDepot.lng,
            );
            if (currentDist <= 0.035) {
              handleArriveAtDepot();
            } else {
              // Tiếp tục di chuyển chặng ngắn cuối cùng nối thẳng vào cổng Depot
              this.moveVehicleTowards(
                vehicle,
                { lat: targetDepot.lat, lng: targetDepot.lng },
                deltaSeconds,
                handleArriveAtDepot,
              );
            }
          });
        }
      }

      // 3.4 Xe đang xả rác tại trạm
      else if (vehicle.status === 'UNLOADING') {
        vehicle.actionRemainingMs -= deltaMs;
        if (vehicle.actionRemainingMs <= 0) {
          const targetDepot =
            (vehicle.targetDepotId && this.depots.find((d) => d.id === vehicle.targetDepotId)) ||
            this.getNearestDepot(vehicle.lat, vehicle.lng);

          const dumpedKg = Math.round(vehicle.currentLoadKg);
          vehicle.currentLoadKg = 0;
          this.stats.totalTripsCompleted += 1;
          this.addLog(
            'DEPOT',
            `✨ Xe [${vehicle.vehicleId}] (${vehicle.driverName}) đã xả sạch ${dumpedKg} kg rác tại [${targetDepot.shortName || targetDepot.name}]. Tải trọng hiện tại: 0 kg. Sẵn sàng nhận nhiệm vụ mới!`,
          );
          this.addThought(
            'DEPOT',
            `Xe [${vehicle.vehicleId}] hoàn thành xả rác tại [${targetDepot.shortName || targetDepot.name}]`,
            `Đã ép xả sạch ${dumpedKg} kg rác. Tải trọng xe reset về 0 kg. Sẵn sàng cho chu kỳ điều phối tiếp theo.`,
            { vehicleId: vehicle.vehicleId, icon: '✨' },
          );

          if (vehicle.waypoints && vehicle.waypoints.length > 0) {
            const nextWaypoint = vehicle.waypoints.shift();
            vehicle.status = 'MOVING_TO_BIN';
            this.setupVehicleRoadNavigation(
              vehicle,
              nextWaypoint,
              nextWaypoint.binId,
              vehicle.waypoints,
            );
          } else {
            vehicle.status = 'IDLE';
            vehicle.targetBinId = null;
            vehicle.targetCoords = null;
            vehicle.targetDepotId = null;
            vehicle.targetDepotName = null;
            vehicle.assignedDepot = null;
            vehicle.assignedBinsCount = 0;
            vehicle.waypoints = [];
            vehicle.roadPathCoordinates = [];
            vehicle.roadPathIndex = 0;
          }
        }
      }
    });

    this.notify();
  }

  /**
   * Di chuyển xe BÁM THEO MẠNG LƯỚI ĐƯỜNG BỘ (Road-Path Traversal)
   * Thay vì đi xuyên qua các khối nhà, xe lần lượt vượt qua từng điểm uốn trên đường,
   * đồng thời xoay đầu xe mượt mà tại các góc cua giao lộ.
   */
  moveVehicleAlongRoadPath(vehicle, deltaSeconds, onArrived) {
    const path = vehicle.roadPathCoordinates;

    // Nếu chưa có tọa độ đường hoặc mảng rỗng, fallback sang bước nội suy thẳng
    if (!path || path.length < 2) {
      if (vehicle.targetCoords) {
        this.moveVehicleTowards(vehicle, vehicle.targetCoords, deltaSeconds, onArrived);
      }
      return;
    }

    let idx = vehicle.roadPathIndex || 0;
    if (idx >= path.length - 1) {
      onArrived();
      return;
    }

    // Đoạn đường hiện tại: path[idx] -> path[idx + 1]
    const targetPt = path[idx + 1];
    const targetLng = targetPt[0];
    const targetLat = targetPt[1];

    const distKm = calculateDistanceKm(vehicle.lat, vehicle.lng, targetLat, targetLng);
    const stepDistKm = (vehicle.speedKmh / 3600) * deltaSeconds;

    if (stepDistKm >= distKm || distKm <= 0.008) {
      // Đã tới góc cua tiếp theo trên đường
      vehicle.lat = targetLat;
      vehicle.lng = targetLng;
      vehicle.roadPathIndex = idx + 1;

      // Nếu đã tới điểm cuối cùng của toàn bộ tuyến đường
      if (vehicle.roadPathIndex >= path.length - 1) {
        onArrived();
      } else {
        // Xoay đầu xe chuẩn bị rẽ vào đoạn đường tiếp theo
        const nextTarget = path[vehicle.roadPathIndex + 1];
        if (nextTarget) {
          vehicle.heading = calculateBearing(
            vehicle.lat,
            vehicle.lng,
            nextTarget[1],
            nextTarget[0],
          );
        }
      }
    } else {
      // Di chuyển từng bước trên đoạn đường hiện tại
      const ratio = stepDistKm / distKm;
      vehicle.lat += (targetLat - vehicle.lat) * ratio;
      vehicle.lng += (targetLng - vehicle.lng) * ratio;
      vehicle.heading = calculateBearing(vehicle.lat, vehicle.lng, targetLat, targetLng);
    }
  }

  /**
   * Di chuyển đường thẳng dự phòng (Fallback)
   */
  moveVehicleTowards(vehicle, targetCoords, deltaSeconds, onArrived) {
    const distKm = calculateDistanceKm(
      vehicle.lat,
      vehicle.lng,
      targetCoords.lat,
      targetCoords.lng,
    );

    if (distKm <= 0.025) {
      vehicle.lat = targetCoords.lat;
      vehicle.lng = targetCoords.lng;
      onArrived();
      return;
    }

    const travelDistKm = (vehicle.speedKmh / 3600) * deltaSeconds;

    if (travelDistKm >= distKm) {
      vehicle.lat = targetCoords.lat;
      vehicle.lng = targetCoords.lng;
      onArrived();
    } else {
      const ratio = travelDistKm / distKm;
      vehicle.lat += (targetCoords.lat - vehicle.lat) * ratio;
      vehicle.lng += (targetCoords.lng - vehicle.lng) * ratio;
      vehicle.heading = calculateBearing(
        vehicle.lat,
        vehicle.lng,
        targetCoords.lat,
        targetCoords.lng,
      );
    }
  }
}

// Singleton Instance dùng chung
export const simulationEngine = new WasteSimulationEngine();
