export type UserRole = 'ADMIN' | 'EMPLOYEE';

export type EmployeePosition = 'DRIVER' | 'SANITATION_WORKER' | 'DISPATCHER' | 'MAINTENANCE';

export type ShiftType = 'MORNING' | 'AFTERNOON' | 'NIGHT';

export type ShiftStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABSENT';

export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'STANDBY';

export type PayrollStatus = 'DRAFT' | 'APPROVED' | 'PAID';

export interface DriverLicenseInfo {
  licenseNumber: string;
  licenseClass: string; // e.g. "Hạng C (Xe tải > 3.5T)", "Hạng FC"
  issueDate: string;
  expiryDate: string;
  verified: boolean;
}

export interface EmployeeProfile {
  id: string; // e.g. "DVR-09201", "WRK-09305"
  fullName: string;
  avatarInitials: string;
  position: EmployeePosition;
  positionTitle: string;
  department: string;
  phone: string;
  email: string;
  nationalId: string; // CCCD
  birthYear: number;
  gender: 'Nam' | 'Nữ';
  address: string;
  joinDate: string;
  contractType: string;
  status: EmploymentStatus;
  assignedVehiclePlate?: string; // Biển số xe rác nếu là tài xế
  driverLicense?: DriverLicenseInfo;
  healthCertStatus: string;
  healthCheckDate: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  baseSalary: number;
  hazardAllowance: number; // Phụ cấp độc hại vệ sinh môi trường
  drivingAllowance: number; // Phụ cấp lái xe chuyên dùng
}

export interface ShiftSchedule {
  id: string; // e.g. "SFT-202609-101"
  shiftDate: string; // "17/09/2026"
  shiftType: ShiftType;
  shiftName: string;
  timeRange: string; // e.g. "04:30 - 11:30"
  routeCode: string;
  routeName: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
  workerIds: string[];
  workerNames: string[];
  assignedBinsCount: number;
  status: ShiftStatus;
  checkInTime?: string;
  checkOutTime?: string;
  tonnageCollected?: number; // Tấn rác thu gom
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  shiftName: string;
  checkIn: string;
  checkOut: string;
  workHours: number;
  overtimeHours: number;
  status: 'ON_TIME' | 'LATE' | 'EXCUSED_LEAVE' | 'UNEXCUSED';
  gpsLocation: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'NGHI_PHEP_NAM' | 'NGHI_OM' | 'DOI_CA';
  leaveTypeLabel: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

export interface MonthlyPayroll {
  id: string;
  employeeId: string;
  employeeName: string;
  positionTitle: string;
  month: string; // "09/2026"
  standardDays: number;
  actualDays: number;
  overtimeHours: number;
  baseSalary: number;
  hazardAllowance: number;
  drivingAllowance: number;
  shiftAllowance: number;
  kpiBonus: number;
  totalEarnings: number;
  insuranceDeduction: number; // 10.5% BHXH, BHYT, BHTN
  unionFee: number;
  taxDeduction: number;
  totalDeductions: number;
  netSalary: number;
  status: PayrollStatus;
  bankName: string;
  bankAccount: string;
  payDate?: string;
}

export type AdminHrmTab = 
  | 'OVERVIEW'
  | 'EMPLOYEES'
  | 'SHIFTS'
  | 'ATTENDANCE'
  | 'PAYROLL';

export type EmployeePortalTab = 
  | 'MY_PROFILE'
  | 'MY_SHIFTS'
  | 'MY_ATTENDANCE'
  | 'MY_PAYSLIP';

export interface AuthUser {
  role: UserRole;
  username: string;
  fullName: string;
  avatarInitials: string;
  title: string;
  employeeProfile?: EmployeeProfile;
}
