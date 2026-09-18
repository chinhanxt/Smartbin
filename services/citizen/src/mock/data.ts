import { HouseholdProfile, BinTelemetryData, CollectionScheduleItem, CitizenComplaint } from '../types';

export const MOCK_HOUSEHOLDS: HouseholdProfile[] = [
  {
    id: 'hgd-001',
    householdCode: 'HGD-TPTD-09218',
    headOfHousehold: 'Nguyễn Văn An',
    idCardNumber: '079088012345',
    phone: '0908 123 456',
    fullAddress: 'Số 48/12 Đường Số 8, Khu Phố 3, Phường Hiệp Phú, TP. Thủ Đức, TP. Hồ Chí Minh',
    street: 'Đường Số 8',
    ward: 'Phường Hiệp Phú',
    district: 'TP. Thủ Đức',
    registeredDate: '15/01/2025',
    memberCount: 4,
    status: 'ACTIVE',
    primaryBin: {
      binId: 'bin-09218',
      deviceCode: 'BIN-IOT-7749',
      model: 'SmartBin Dual-Sort Solar v2.5',
      capacityLiters: 120,
      installDate: '18/01/2025',
      rfidTag: 'E280-1160-2000-7749',
      loraDevEui: 'A840410001889922',
      status: 'PAIRED',
      macAddress: '9C:65:F9:3A:42:1B',
      firmwareVersion: 'v2.4.8-release'
    }
  },
  {
    id: 'hgd-002',
    householdCode: 'HGD-TPTD-09219',
    headOfHousehold: 'Trần Thị Mai',
    idCardNumber: '079192009876',
    phone: '0913 987 654',
    fullAddress: 'Số 104 Lê Văn Việt, Phường Tăng Nhơn Phú B, TP. Thủ Đức, TP. Hồ Chí Minh',
    street: 'Lê Văn Việt',
    ward: 'Phường Tăng Nhơn Phú B',
    district: 'TP. Thủ Đức',
    registeredDate: '02/03/2025',
    memberCount: 3,
    status: 'ACTIVE',
    primaryBin: {
      binId: 'bin-09219',
      deviceCode: 'BIN-IOT-8812',
      model: 'SmartBin Standard Compact 90L',
      capacityLiters: 90,
      installDate: '05/03/2025',
      rfidTag: 'E280-1160-2000-8812',
      loraDevEui: 'A840410001889933',
      status: 'PAIRED',
      macAddress: '9C:65:F9:3B:11:8A',
      firmwareVersion: 'v2.4.6-release'
    }
  }
];

export const MOCK_BIN_TELEMETRY: Record<string, BinTelemetryData> = {
  'bin-09218': {
    binId: 'bin-09218',
    householdId: 'hgd-001',
    fillLevel: 68,
    fillStatus: 'WARNING_HIGH',
    odorRisk: {
      level: 'CAUTION',
      nh3Ppm: 12.4,
      h2sPpm: 4.8,
      detected: true,
      description: 'Phát hiện khí lên men hữu cơ vượt ngưỡng tiêu chuẩn nhẹ (12.4 ppm). Khuyến cáo đậy kín nắp và chuẩn bị giao rác sáng nay.'
    },
    batteryLevel: 86,
    solarCharging: true,
    temperatureCelsius: 31.5,
    humidityPercent: 74,
    lastUpdated: new Date(Date.now() - 3 * 60000).toISOString(), // 3 mins ago
    sensorStatus: 'ONLINE',
    lidOpenCountToday: 14,
    history: [
      { timestamp: '06:00', fillLevel: 35, odorLevel: 2 },
      { timestamp: '09:00', fillLevel: 42, odorLevel: 3 },
      { timestamp: '12:00', fillLevel: 55, odorLevel: 6 },
      { timestamp: '15:00', fillLevel: 62, odorLevel: 9 },
      { timestamp: '18:00', fillLevel: 68, odorLevel: 12.4 }
    ]
  },
  'bin-09219': {
    binId: 'bin-09219',
    householdId: 'hgd-002',
    fillLevel: 28,
    fillStatus: 'NORMAL',
    odorRisk: {
      level: 'SAFE',
      nh3Ppm: 2.1,
      h2sPpm: 0.5,
      detected: false,
      description: 'Chỉ số không khí bên trong thùng hoàn toàn an toàn, không có nguy cơ mùi hôi.'
    },
    batteryLevel: 95,
    solarCharging: true,
    temperatureCelsius: 29.8,
    humidityPercent: 68,
    lastUpdated: new Date(Date.now() - 8 * 60000).toISOString(),
    sensorStatus: 'ONLINE',
    lidOpenCountToday: 6,
    history: [
      { timestamp: '06:00', fillLevel: 15, odorLevel: 1 },
      { timestamp: '09:00', fillLevel: 20, odorLevel: 1.5 },
      { timestamp: '12:00', fillLevel: 22, odorLevel: 1.8 },
      { timestamp: '15:00', fillLevel: 25, odorLevel: 2.0 },
      { timestamp: '18:00', fillLevel: 28, odorLevel: 2.1 }
    ]
  }
};

export const MOCK_COLLECTION_SCHEDULES: CollectionScheduleItem[] = [
  {
    id: 'sched-today',
    dayName: 'Hôm nay (Thứ Năm)',
    dateStr: '17/09/2026',
    timeSlot: '07:30 - 09:30',
    wasteCategory: 'ORGANIC',
    categoryLabel: 'Rác Sinh Hoạt & Hữu Cơ',
    status: 'EN_ROUTE',
    assignedVehicle: {
      vehicleId: 'VEH-04',
      plateNumber: '59C-882.14',
      driverName: 'Nguyễn Văn Hùng',
      driverPhone: '0978 889 900',
      latitude: 10.8492,
      longitude: 106.7754,
      distanceMeters: 420,
      etaMinutes: 11,
      speedKmH: 18.5,
      lastPing: new Date(Date.now() - 45000).toISOString()
    },
    notes: 'Xe đang di chuyển trong tuyến Hẻm 48 Đường Số 8, dự kiến đến điểm thu gom trong 11 phút.'
  },
  {
    id: 'sched-tomorrow',
    dayName: 'Ngày mai (Thứ Sáu)',
    dateStr: '18/09/2026',
    timeSlot: '14:00 - 16:30',
    wasteCategory: 'RECYCLABLE',
    categoryLabel: 'Rác Tái Chế (Nhựa, Giấy, Kim loại)',
    status: 'UPCOMING',
    notes: 'Thu gom phân loại rác tái chế định kỳ cuối tuần. Vui lòng phân loại sẵn vào túi vàng/xanh.'
  },
  {
    id: 'sched-prev',
    dayName: 'Thứ Ba',
    dateStr: '15/09/2026',
    timeSlot: '07:30 - 09:00',
    wasteCategory: 'ORGANIC',
    categoryLabel: 'Rác Sinh Hoạt & Hữu Cơ',
    status: 'COMPLETED',
    completionTime: '08:24 - 15/09/2026',
    notes: 'Đã hoàn tất thu gom đúng giờ. Khối lượng ghi nhận: 6.8 kg.'
  }
];

export const MOCK_COMPLAINTS: CitizenComplaint[] = [
  {
    id: 'pa-001',
    complaintCode: 'PA-2026-0089',
    category: 'MISSED_COLLECTION',
    categoryLabel: 'Bỏ sót thu gom rác',
    title: 'Xe thu gom không ghé lấy rác ngõ 48/12 sáng Thứ Ba',
    description: 'Thùng rác gia đình đã để trước cổng từ 07:00 đúng quy định nhưng xe thu gom đi qua đầu hẻm rồi rẽ hướng khác, không vào lấy rác khiến rác ứ đọng.',
    householdCode: 'HGD-TPTD-09218',
    binCode: 'BIN-IOT-7749',
    contactPhone: '0908 123 456',
    createdAt: '15/09/2026 09:45',
    updatedAt: '15/09/2026 11:20',
    status: 'RESOLVED',
    priority: 'HIGH',
    attachedImages: [
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&auto=format&fit=crop&q=60'
    ],
    proofImages: [
      'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=500&auto=format&fit=crop&q=60'
    ],
    inspectorNotes: 'Đã xác minh qua GPS xe 59C-882.14 do đường hẻm có xe vật liệu xây dựng chắn lối lúc 08:15. Đã điều động xe nhỏ 3 bánh quay lại thu dọn lúc 11:15.',
    inspectorName: 'Trần Minh Tuấn (Thanh tra Môi trường P. Hiệp Phú)',
    driverResolutionNotes: 'Đã thu sạch thùng rác và quét dọn khu vực xung quanh.',
    rating: 5,
    feedbackComment: 'Xử lý phản ánh rất nhanh và nhiệt tình, cảm ơn tổ thu gom!'
  },
  {
    id: 'pa-002',
    complaintCode: 'PA-2026-0104',
    category: 'INCOMPLETE_COLLECTION',
    categoryLabel: 'Chưa thu sạch / Rơi vãi',
    title: 'Rác rơi vãi quanh miệng thùng sau khi đổ vào xe ép',
    description: 'Nhân viên thu gom khi đổ thùng làm rơi rớt một số túi rác nhỏ quanh miệng cống trước nhà nhưng không dọn lại.',
    householdCode: 'HGD-TPTD-09218',
    binCode: 'BIN-IOT-7749',
    contactPhone: '0908 123 456',
    createdAt: '16/09/2026 18:10',
    updatedAt: '17/09/2026 07:15',
    status: 'DISPATCHED_RESOLVE',
    priority: 'MEDIUM',
    attachedImages: [
      'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=500&auto=format&fit=crop&q=60'
    ],
    inspectorNotes: 'Đã nhắc nhở tổ công nhân tuyến 04. Đã yêu cầu kíp trực sáng 17/09 đến xịt rửa và khử mùi trước cửa nhà dân.',
    inspectorName: 'Lê Hoàng Nam (Điều phối viên)'
  }
];
