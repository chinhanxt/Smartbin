export type HouseholdStatus = 'ACTIVE' | 'PENDING_VERIFY' | 'SUSPENDED';

export type BinDeviceStatus = 'PAIRED' | 'UNPAIRED' | 'MAINTENANCE' | 'SENSOR_FAULT';

export interface SmartBinDevice {
  binId: string;
  deviceCode: string;
  model: string;
  capacityLiters: number;
  installDate: string;
  rfidTag: string;
  loraDevEui: string;
  status: BinDeviceStatus;
  macAddress: string;
  firmwareVersion: string;
}

export interface HouseholdProfile {
  id: string;
  householdCode: string;
  headOfHousehold: string;
  idCardNumber: string;
  phone: string;
  fullAddress: string;
  street: string;
  ward: string;
  district: string;
  registeredDate: string;
  memberCount: number;
  status: HouseholdStatus;
  primaryBin: SmartBinDevice;
}

export type OdorRiskLevel = 'SAFE' | 'CAUTION' | 'CRITICAL_ODOR';
export type SensorNetworkStatus = 'ONLINE' | 'OFFLINE' | 'SENSOR_FAULT';

export interface BinTelemetryData {
  binId: string;
  householdId: string;
  fillLevel: number; // 0 - 100%
  fillStatus: 'NORMAL' | 'WARNING_HIGH' | 'CRITICAL_FULL';
  odorRisk: {
    level: OdorRiskLevel;
    nh3Ppm: number;
    h2sPpm: number;
    detected: boolean;
    description: string;
  };
  batteryLevel: number; // 0 - 100%
  solarCharging: boolean;
  temperatureCelsius: number;
  humidityPercent: number;
  lastUpdated: string;
  sensorStatus: SensorNetworkStatus;
  lidOpenCountToday: number;
  history: {
    timestamp: string;
    fillLevel: number;
    odorLevel: number;
  }[];
}

export type WasteCategory = 'ORGANIC' | 'RECYCLABLE' | 'RESIDUAL' | 'BULKY';
export type CollectionServiceStatus = 'UPCOMING' | 'EN_ROUTE' | 'COLLECTING' | 'COMPLETED' | 'MISSED';

export interface CollectionScheduleItem {
  id: string;
  dayName: string;
  dateStr: string;
  timeSlot: string;
  wasteCategory: WasteCategory;
  categoryLabel: string;
  status: CollectionServiceStatus;
  assignedVehicle?: {
    vehicleId: string;
    plateNumber: string;
    driverName: string;
    driverPhone: string;
    latitude: number;
    longitude: number;
    distanceMeters: number;
    etaMinutes: number;
    speedKmH: number;
    lastPing: string;
  };
  completionTime?: string;
  notes: string;
}

export type ComplaintCategory =
  | 'MISSED_COLLECTION'
  | 'INCOMPLETE_COLLECTION'
  | 'DAMAGED_BIN'
  | 'SCHEDULE_VIOLATION'
  | 'ODOR_LEAKAGE'
  | 'OTHER';

export type ComplaintStatus =
  | 'RECEIVED'
  | 'VERIFYING'
  | 'DISPATCHED_RESOLVE'
  | 'RESOLVED'
  | 'REJECTED';

export interface CitizenComplaint {
  id: string;
  complaintCode: string;
  category: ComplaintCategory;
  categoryLabel: string;
  title: string;
  description: string;
  householdCode: string;
  binCode: string;
  contactPhone: string;
  createdAt: string;
  updatedAt: string;
  status: ComplaintStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  attachedImages: string[];
  proofImages?: string[];
  inspectorNotes?: string;
  inspectorName?: string;
  driverResolutionNotes?: string;
  rating?: number;
  feedbackComment?: string;
}
