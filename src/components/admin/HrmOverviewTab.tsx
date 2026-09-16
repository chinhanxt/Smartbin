import React, { useState } from 'react';
import { 
  Users, 
  Truck, 
  Clock, 
  Banknote, 
  Navigation, 
  Radio, 
  ChevronRight,
  HardHat,
  Search,
  Layers,
  Plus,
  Minus,
  Compass,
  CheckCircle2,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { 
  AdminHrmTab, 
  EmployeeProfile, 
  ShiftSchedule, 
  AttendanceRecord, 
  MonthlyPayroll, 
  LeaveRequest 
} from '../../types';
import { formatVND } from '../../lib/utils';
import { StatusBadge } from '../shared/StatusBadge';

interface HrmOverviewTabProps {
  employees: EmployeeProfile[];
  shifts: ShiftSchedule[];
  attendance: AttendanceRecord[];
  payroll: MonthlyPayroll[];
  leaveRequests: LeaveRequest[];
  onNavigateTab: (tab: AdminHrmTab) => void;
}

interface UrbanCorridor {
  id: string;
  code: string;
  name: string;
  color: string;
  routeBg: string;
  truckPlate: string;
  driverName: string;
  driverLicense: string;
  workers: string[];
  totalBins: number;
  clearedBins: number;
  tonnagePlan: number;
  tonnageCurrent: number;
  speedKmH: number;
  statusBadge: 'IN_PROGRESS' | 'SCHEDULED' | 'COMPLETED';
}

export const HrmOverviewTab: React.FC<HrmOverviewTabProps> = ({
  employees,
  shifts,
  attendance,
  payroll,
  leaveRequests,
  onNavigateTab
}) => {
  const totalEmployees = employees.length;
  const driversCount = employees.filter(e => e.position === 'DRIVER').length;
  const workersCount = employees.filter(e => e.position === 'SANITATION_WORKER').length;
  const todayShifts = shifts.filter(s => s.shiftDate === '17/09/2026');
  const runningShifts = todayShifts.filter(s => s.status === 'IN_PROGRESS').length;
  const totalPayrollMonth = payroll.reduce((sum, p) => sum + p.netSalary, 0);

  // Urban Corridors data
  const corridors: UrbanCorridor[] = [
    {
      id: 'COR-01',
      code: 'TUYẾN 01',
      name: 'Đ. Lê Văn Việt',
      color: '#1a73e8', // Google Maps Blue
      routeBg: '#e8f0fe',
      truckPlate: '59C-882.14',
      driverName: 'Võ Quốc Cường',
      driverLicense: 'Bằng C',
      workers: ['Trần Văn Tuấn', 'Lê Hoàng Long'],
      totalBins: 36,
      clearedBins: 28,
      tonnagePlan: 8.0,
      tonnageCurrent: 6.2,
      speedKmH: 18,
      statusBadge: 'IN_PROGRESS'
    },
    {
      id: 'COR-02',
      code: 'TUYẾN 02',
      name: 'Đường Số 8',
      color: '#ea8600', // Google Maps Amber
      routeBg: '#fef7e0',
      truckPlate: '59C-912.05',
      driverName: 'Nguyễn Văn Long',
      driverLicense: 'Bằng C',
      workers: ['Đặng Quốc Bảo'],
      totalBins: 28,
      clearedBins: 21,
      tonnagePlan: 8.0,
      tonnageCurrent: 4.8,
      speedKmH: 14,
      statusBadge: 'IN_PROGRESS'
    },
    {
      id: 'COR-03',
      code: 'TUYẾN 03',
      name: 'Đ. Tân Lập - Chợ',
      color: '#1e8e3e', // Google Maps Green
      routeBg: '#e6f4ea',
      truckPlate: '59C-774.20',
      driverName: 'Bùi Văn Hùng',
      driverLicense: 'Bằng FC',
      workers: ['Phạm Minh Trí', 'Ngô Quốc Thắng'],
      totalBins: 32,
      clearedBins: 0,
      tonnagePlan: 8.0,
      tonnageCurrent: 0.0,
      speedKmH: 0,
      statusBadge: 'SCHEDULED'
    },
    {
      id: 'COR-04',
      code: 'TUYẾN 04',
      name: 'Đ. Trương Văn Hải',
      color: '#9334e6', // Google Maps Purple
      routeBg: '#f3e8fd',
      truckPlate: '59C-663.88',
      driverName: 'Tổ Trực Kỹ Thuật',
      driverLicense: 'Bằng C',
      workers: ['Vũ Đình Trọng'],
      totalBins: 24,
      clearedBins: 24,
      tonnagePlan: 6.0,
      tonnageCurrent: 5.9,
      speedKmH: 0,
      statusBadge: 'COMPLETED'
    }
  ];

  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('COR-01');
  const selectedCorridor = corridors.find(c => c.id === selectedCorridorId) || corridors[0];
  const [selectedShiftView, setSelectedShiftView] = useState<'MORNING' | 'AFTERNOON' | 'NIGHT'>('MORNING');

  // Urban Waste Zones (Super concise)
  const urbanZones = [
    { zone: 'Khu A • Lê Văn Việt', tons: '3.6 / 4.5T', percent: 80, tag: 'Vô cơ 55%', color: 'bg-blue-600' },
    { zone: 'Khu B • Đường Số 8', tons: '2.6 / 3.2T', percent: 81, tag: 'Hữu cơ 68%', color: 'bg-amber-500' },
    { zone: 'Khu C • Chợ Hiệp Phú', tons: '4.1 / 5.8T', percent: 71, tag: 'Chợ 74%', color: 'bg-emerald-600' },
    { zone: 'Khu D • Tân Lập', tons: '0.7 / 2.0T', percent: 35, tag: 'Tái chế 40%', color: 'bg-purple-600' }
  ];

  return (
    <div className="space-y-5">
      {/* Streamlined Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span>P. HIỆP PHÚ, TP. THỦ ĐỨC</span>
            <span>•</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
              TRỰC TUYẾN
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground mt-0.5">
            Điều Hành Đội Xe & Nhân Lực Đô Thị
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground flex items-center gap-2 shadow-xs">
            <Radio size={13} className="text-emerald-600 animate-pulse" />
            <span>GPS: 2 Xe Đang Chạy</span>
          </div>
          <button
            onClick={() => onNavigateTab('SHIFTS')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 shadow-xs transition-colors"
          >
            <span>Phân Ca Tuyến</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Top 4 Minimalist KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Workforce */}
        <div 
          onClick={() => onNavigateTab('EMPLOYEES')}
          className="rounded-xl border border-border bg-card p-3.5 shadow-xs hover:border-primary/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Quân Số</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-primary">
              <Users size={16} />
            </span>
          </div>
          <div className="mt-1">
            <div className="text-xl font-black font-mono text-foreground">{totalEmployees} Nhân Sự</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{driversCount} tài xế • {workersCount} công nhân</div>
          </div>
        </div>

        {/* Live Vehicles */}
        <div 
          onClick={() => onNavigateTab('SHIFTS')}
          className="rounded-xl border border-border bg-card p-3.5 shadow-xs hover:border-primary/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Xe Ép Hoạt Động</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <Truck size={16} />
            </span>
          </div>
          <div className="mt-1">
            <div className="text-xl font-black font-mono text-emerald-700">{runningShifts} Tổ Xe</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">59C-882.14 & 59C-912.05</div>
          </div>
        </div>

        {/* GPS Attendance */}
        <div 
          onClick={() => onNavigateTab('ATTENDANCE')}
          className="rounded-xl border border-border bg-card p-3.5 shadow-xs hover:border-primary/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Điểm Danh</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-50 text-violet-700">
              <Clock size={16} />
            </span>
          </div>
          <div className="mt-1">
            <div className="text-xl font-black font-mono text-foreground">100% Đúng Giờ</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Check-in bãi xe khớp GPS</div>
          </div>
        </div>

        {/* Payroll Total */}
        <div 
          onClick={() => onNavigateTab('PAYROLL')}
          className="rounded-xl border border-border bg-card p-3.5 shadow-xs hover:border-primary/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Quỹ Lương Kỳ 09</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-800">
              <Banknote size={16} />
            </span>
          </div>
          <div className="mt-1">
            <div className="text-xl font-black font-mono text-primary">{formatVND(totalPayrollMonth)}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Đã duyệt chi lương & phụ cấp</div>
          </div>
        </div>
      </div>

      {/* SƠ ĐỒ ĐÔ THỊ 01: BẢN ĐỒ GOOGLE MAPS NỀN TRẮNG & THEO DÕI ĐỘI XE */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
        {/* Header strip & Route Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-black bg-blue-100 text-blue-800">
              SƠ ĐỒ 01
            </span>
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              Bản Đồ Tuyến & Đội Xe Đô Thị (Google Maps)
            </h2>
          </div>

          {/* Quick Route Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {corridors.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCorridorId(c.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 border ${
                  selectedCorridorId === c.id
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedCorridorId === c.id ? '#ffffff' : c.color }} />
                <span>{c.code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Map Grid + Compact Route Inspector */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left: Google Maps Light Canvas (8 cols) */}
          <div className="lg:col-span-8 rounded-xl border border-slate-300 bg-[#f4f3f0] relative overflow-hidden shadow-xs">
            {/* Google Maps Top Bar (Search + Layers) */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <div className="bg-white/95 backdrop-blur-xs rounded-md shadow px-2.5 py-1.5 flex items-center gap-2 text-xs border border-slate-200">
                <Search size={13} className="text-slate-400" />
                <span className="font-medium text-slate-700">P. Hiệp Phú, TP. Thủ Đức</span>
              </div>
              <div className="bg-white/95 backdrop-blur-xs rounded-md shadow px-2 py-1.5 flex items-center gap-1 text-[11px] font-semibold text-slate-700 border border-slate-200">
                <Layers size={13} className="text-blue-600" />
                <span>Lớp Tuyến Rác</span>
              </div>
            </div>

            {/* Google Maps Legend Chip (Top-right) */}
            <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-xs rounded-md shadow px-2 py-1 flex items-center gap-2 text-[10px] font-semibold text-slate-600 border border-slate-200">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#34a853]" /> &lt;50%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#fbbc04]" /> 50-80%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#ea4335]" /> &gt;80%
              </span>
            </div>

            {/* Google Maps Floating Controls (Bottom-right) */}
            <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5 items-end">
              <div className="bg-white rounded shadow border border-slate-200 flex flex-col">
                <button className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 border-b border-slate-100 text-xs font-bold">
                  <Plus size={12} />
                </button>
                <button className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold">
                  <Minus size={12} />
                </button>
              </div>
              <div className="bg-white rounded shadow border border-slate-200 p-1">
                <Compass size={14} className="text-slate-500" />
              </div>
            </div>

            {/* Scale Bar (Bottom-left) */}
            <div className="absolute bottom-3 left-3 z-10 bg-white/90 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-600 border border-slate-200 flex items-center gap-1">
              <div className="w-8 h-[2px] bg-slate-700" />
              <span>200 m</span>
            </div>

            {/* SVG Visual Canvas (Google Maps Light Theme) */}
            <div className="relative w-full aspect-[16/10] overflow-hidden">
              <svg 
                className="w-full h-full" 
                viewBox="0 0 720 440" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Background Base Ground: Google Maps Warm Neutral */}
                <rect width="720" height="440" fill="#f2efe9" />

                {/* Urban Residential Blocks (White parcels with subtle borders) */}
                {/* Row 1 (y: 25 - 105) */}
                <rect x="35" y="25" width="135" height="80" rx="4" fill="#ffffff" stroke="#e3dfd8" strokeWidth="1" />
                <rect x="190" y="25" width="120" height="80" rx="4" fill="#ffffff" stroke="#e3dfd8" strokeWidth="1" />
                <rect x="330" y="25" width="160" height="80" rx="4" fill="#ffffff" stroke="#e3dfd8" strokeWidth="1" />
                <rect x="510" y="25" width="175" height="80" rx="4" fill="#ffffff" stroke="#e3dfd8" strokeWidth="1" />

                {/* Row 2 (y: 125 - 208) */}
                <rect x="35" y="125" width="135" height="83" rx="4" fill="#ffffff" stroke="#e3dfd8" strokeWidth="1" />
                <rect x="190" y="125" width="120" height="83" rx="4" fill="#ffffff" stroke="#e3dfd8" strokeWidth="1" />
                <rect x="330" y="125" width="160" height="83" rx="4" fill="#ffffff" stroke="#e3dfd8" strokeWidth="1" />
                <rect x="510" y="125" width="175" height="83" rx="4" fill="#ffffff" stroke="#e3dfd8" strokeWidth="1" />

                {/* Row 3 (y: 232 - 330) */}
                <rect x="35" y="232" width="135" height="98" rx="4" fill="#ffffff" stroke="#e3dfd8" strokeWidth="1" />
                <rect x="190" y="232" width="120" height="98" rx="4" fill="#ffffff" stroke="#e3dfd8" strokeWidth="1" />
                <rect x="330" y="232" width="160" height="98" rx="4" fill="#ffffff" stroke="#e3dfd8" strokeWidth="1" />
                <rect x="510" y="232" width="175" height="98" rx="4" fill="#ffffff" stroke="#e3dfd8" strokeWidth="1" />

                {/* Row 4 (y: 350 - 415) */}
                <rect x="35" y="350" width="135" height="65" rx="4" fill="#ffffff" stroke="#e3dfd8" strokeWidth="1" />
                <rect x="190" y="350" width="120" height="65" rx="4" fill="#ffffff" stroke="#e3dfd8" strokeWidth="1" />
                <rect x="330" y="350" width="160" height="65" rx="4" fill="#ffffff" stroke="#e3dfd8" strokeWidth="1" />
                <rect x="510" y="350" width="175" height="65" rx="4" fill="#ffffff" stroke="#e3dfd8" strokeWidth="1" />

                {/* Google Maps Park (Green zone in Block 1) */}
                <path d="M 40 30 Q 155 28 160 85 Q 130 95 40 95 Z" fill="#c8e6c9" />
                <text x="50" y="65" fill="#2e7d32" fontSize="9.5" fontWeight="bold">CÔNG VIÊN HIỆP PHÚ</text>

                {/* Water Canal (Rạch Suối Cái - Light Sky Blue below y=350) */}
                <path d="M 520 410 Q 610 375 700 405" stroke="#aadaff" strokeWidth="16" strokeLinecap="round" />
                <text x="595" y="422" fill="#1a73e8" fontSize="9" fontWeight="bold">RẠCH SUỐI CÁI</text>

                {/* Secondary Urban Streets (Clean white roads with gray outlines) */}
                <line x1="180" y1="15" x2="180" y2="425" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" />
                <line x1="180" y1="15" x2="180" y2="425" stroke="#dad7d1" strokeWidth="1" />

                <line x1="320" y1="15" x2="320" y2="425" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" />
                <line x1="320" y1="15" x2="320" y2="425" stroke="#dad7d1" strokeWidth="1" />

                <line x1="500" y1="15" x2="500" y2="425" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" />
                <line x1="500" y1="15" x2="500" y2="425" stroke="#dad7d1" strokeWidth="1" />

                <line x1="15" y1="115" x2="705" y2="115" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" />
                <line x1="15" y1="115" x2="705" y2="115" stroke="#dad7d1" strokeWidth="1" />

                <line x1="15" y1="340" x2="705" y2="340" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" />
                <line x1="15" y1="340" x2="705" y2="340" stroke="#dad7d1" strokeWidth="1" />

                {/* MAIN ARTERIAL: ĐẠI LỘ LÊ VĂN VIỆT (Base Road White/Cream with borders) */}
                <line x1="15" y1="220" x2="705" y2="220" stroke="#e8dbb5" strokeWidth="22" strokeLinecap="round" />
                <line x1="15" y1="220" x2="705" y2="220" stroke="#fffae6" strokeWidth="18" strokeLinecap="round" />

                {/* ROUTE 01 RIBBON (Lê Văn Việt - Google Maps Blue) */}
                <path 
                  d="M 25 220 L 695 220" 
                  stroke={selectedCorridorId === 'COR-01' ? '#1a73e8' : '#4285f4'} 
                  strokeWidth={selectedCorridorId === 'COR-01' ? '8' : '5'} 
                  strokeLinecap="round"
                  className="cursor-pointer transition-all"
                  onClick={() => setSelectedCorridorId('COR-01')}
                />
                <text 
                  x="60" 
                  y="210" 
                  fill="#1a73e8" 
                  fontSize="10" 
                  fontWeight="bold"
                  style={{ paintOrder: 'stroke fill', stroke: '#ffffff', strokeWidth: '3px' }}
                >
                  Đ. LÊ VĂN VIỆT (TUYẾN 01)
                </text>

                {/* ROUTE 02 RIBBON (Đường Số 8 - Google Maps Amber) */}
                <path 
                  d="M 320 20 L 320 340 L 680 340" 
                  stroke={selectedCorridorId === 'COR-02' ? '#d97706' : '#ea8600'} 
                  strokeWidth={selectedCorridorId === 'COR-02' ? '8' : '5'} 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="cursor-pointer transition-all"
                  onClick={() => setSelectedCorridorId('COR-02')}
                />
                <text 
                  x="330" 
                  y="70" 
                  fill="#b45309" 
                  fontSize="9.5" 
                  fontWeight="bold"
                  style={{ paintOrder: 'stroke fill', stroke: '#ffffff', strokeWidth: '3px' }}
                >
                  ĐƯỜNG SỐ 8 (TUYẾN 02)
                </text>

                {/* ROUTE 03 RIBBON (Tân Lập - Google Maps Green) */}
                <path 
                  d="M 40 115 L 180 115 L 180 340 L 55 340" 
                  stroke={selectedCorridorId === 'COR-03' ? '#059669' : '#1e8e3e'} 
                  strokeWidth={selectedCorridorId === 'COR-03' ? '8' : '5'} 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="cursor-pointer transition-all"
                  onClick={() => setSelectedCorridorId('COR-03')}
                />
                <text 
                  x="190" 
                  y="170" 
                  fill="#047857" 
                  fontSize="9.5" 
                  fontWeight="bold"
                  style={{ paintOrder: 'stroke fill', stroke: '#ffffff', strokeWidth: '3px' }}
                >
                  Đ. TÂN LẬP & CHỢ (TUYẾN 03)
                </text>

                {/* ROUTE 04 RIBBON (Trương Văn Hải - Google Maps Purple) */}
                <path 
                  d="M 500 20 L 500 420" 
                  stroke={selectedCorridorId === 'COR-04' ? '#7c3aed' : '#9334e6'} 
                  strokeWidth={selectedCorridorId === 'COR-04' ? '8' : '5'} 
                  strokeLinecap="round"
                  className="cursor-pointer transition-all"
                  onClick={() => setSelectedCorridorId('COR-04')}
                />
                <text 
                  x="510" 
                  y="70" 
                  fill="#6d28d9" 
                  fontSize="9.5" 
                  fontWeight="bold"
                  style={{ paintOrder: 'stroke fill', stroke: '#ffffff', strokeWidth: '3px' }}
                >
                  Đ. TRƯƠNG VĂN HẢI (TUYẾN 04)
                </text>

                {/* GOOGLE MAPS POI PINS */}
                {/* Depot Garage Pin on Southern Road */}
                <g transform="translate(60, 340)">
                  <rect x="-6" y="-12" width="84" height="24" rx="12" fill="#ffffff" stroke="#ea8600" strokeWidth="1.5" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.15))" />
                  <circle cx="5" cy="0" r="4" fill="#ea8600" />
                  <text x="14" y="4" fill="#78350f" fontSize="9" fontWeight="bold">BÃI XE DEPOT</text>
                </g>

                {/* Transfer Station Pin next to Truong Van Hai */}
                <g transform="translate(520, 150)">
                  <rect x="-6" y="-12" width="105" height="24" rx="12" fill="#ffffff" stroke="#1a73e8" strokeWidth="1.5" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.15))" />
                  <circle cx="5" cy="0" r="4" fill="#1a73e8" />
                  <text x="14" y="4" fill="#1e3a8a" fontSize="9" fontWeight="bold">TRẠM TRUNG CHUYỂN</text>
                </g>

                {/* SMARTBIN NODES (Placed Exactly On Roads) */}
                {/* On Le Van Viet */}
                <circle cx="100" cy="220" r="5" fill="#34a853" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="250" cy="220" r="5" fill="#fbbc04" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="450" cy="220" r="6" fill="#ea4335" stroke="#ffffff" strokeWidth="2">
                  <animate attributeName="r" values="5;7;5" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="580" cy="220" r="5" fill="#34a853" stroke="#ffffff" strokeWidth="1.5" />

                {/* On Duong 8 */}
                <circle cx="320" cy="65" r="5" fill="#fbbc04" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="320" cy="165" r="5" fill="#34a853" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="430" cy="340" r="5" fill="#34a853" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="570" cy="340" r="5" fill="#fbbc04" stroke="#ffffff" strokeWidth="1.5" />

                {/* On Tan Lap & North Road */}
                <circle cx="100" cy="115" r="5" fill="#fbbc04" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="180" cy="165" r="6" fill="#ea4335" stroke="#ffffff" strokeWidth="2" />
                <circle cx="180" cy="285" r="5" fill="#34a853" stroke="#ffffff" strokeWidth="1.5" />

                {/* On Truong Van Hai */}
                <circle cx="500" cy="65" r="5" fill="#34a853" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="500" cy="150" r="5" fill="#fbbc04" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="500" cy="285" r="5" fill="#34a853" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="500" cy="380" r="5" fill="#fbbc04" stroke="#ffffff" strokeWidth="1.5" />

                {/* ACTIVE VEHICLE 1: 59C-882.14 on Le Van Viet */}
                <g 
                  transform="translate(390, 220)" 
                  className="cursor-pointer"
                  onClick={() => setSelectedCorridorId('COR-01')}
                >
                  <circle cx="0" cy="0" r="14" fill="#4285f4" opacity="0.25">
                    <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="0" cy="0" r="7" fill="#1a73e8" stroke="#ffffff" strokeWidth="2" />
                  
                  <rect x="-48" y="-28" width="96" height="20" rx="10" fill="#ffffff" stroke="#4285f4" strokeWidth="1.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))" />
                  <text x="0" y="-14" fill="#1a73e8" fontSize="9" fontWeight="bold" textAnchor="middle">
                    59C-882.14 • 18km/h
                  </text>
                </g>

                {/* ACTIVE VEHICLE 2: 59C-912.05 on Duong 8 (x=320, y=280) */}
                <g 
                  transform="translate(320, 280)" 
                  className="cursor-pointer"
                  onClick={() => setSelectedCorridorId('COR-02')}
                >
                  <circle cx="0" cy="0" r="14" fill="#ea8600" opacity="0.25">
                    <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="0" cy="0" r="7" fill="#d97706" stroke="#ffffff" strokeWidth="2" />
                  
                  <rect x="-48" y="-28" width="96" height="20" rx="10" fill="#ffffff" stroke="#ea8600" strokeWidth="1.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))" />
                  <text x="0" y="-14" fill="#b45309" fontSize="9" fontWeight="bold" textAnchor="middle">
                    59C-912.05 • 14km/h
                  </text>
                </g>
              </svg>
            </div>
          </div>

          {/* Right: Ultra-compact Route Inspector (4 cols) */}
          <div className="lg:col-span-4 rounded-xl border border-border bg-muted/20 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedCorridor.color }} />
                <span className="text-xs font-mono font-bold text-foreground">{selectedCorridor.code}</span>
              </div>
              <StatusBadge status={selectedCorridor.statusBadge} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground">{selectedCorridor.name}</h3>
              <div className="flex items-center justify-between text-xs mt-1.5 p-2 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground">Xe Ép:</span>
                <span className="font-mono font-black text-foreground">{selectedCorridor.truckPlate}</span>
              </div>
            </div>

            {/* Compact Crew Pill Box */}
            <div className="p-2.5 rounded-lg bg-card border border-border space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tài Xế:</span>
                <span className="font-bold text-foreground">{selectedCorridor.driverName} ({selectedCorridor.driverLicense})</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Công Nhân:</span>
                <span className="text-foreground">{selectedCorridor.workers.join(', ')}</span>
              </div>
            </div>

            {/* Visual Gauges */}
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground">Thu Gom:</span>
                  <span className="font-mono font-bold text-foreground">
                    {selectedCorridor.clearedBins}/{selectedCorridor.totalBins} Thùng ({Math.round((selectedCorridor.clearedBins / selectedCorridor.totalBins) * 100)}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${(selectedCorridor.clearedBins / selectedCorridor.totalBins) * 100}%`,
                      backgroundColor: selectedCorridor.color
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground">Tải Trọng Bồn:</span>
                  <span className="font-mono font-bold text-foreground">
                    {selectedCorridor.tonnageCurrent}/{selectedCorridor.tonnagePlan} Tấn ({Math.round((selectedCorridor.tonnageCurrent / selectedCorridor.tonnagePlan) * 100)}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-emerald-600 transition-all"
                    style={{ width: `${(selectedCorridor.tonnageCurrent / selectedCorridor.tonnagePlan) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('SHIFTS')}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs"
            >
              <span>Xem Bảng Ca Chi Tiết</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* SƠ ĐỒ ĐÔ THỊ 02 & 03: GỌN GÀNG, ÍT CHỮ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* SƠ ĐỒ ĐÔ THỊ 02: TẢI TRỌNG BỒN ÉP & 4 PHÂN KHU */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-black bg-emerald-100 text-emerald-800">
                  SƠ ĐỒ 02
                </span>
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  Tải Trọng Bồn Ép & Phân Khu
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Nén 3.2:1
              </span>
            </div>

            {/* Tank Simulation Graphic (Clean & Modern) */}
            <div className="mt-3 p-3 rounded-xl border border-border bg-muted/30 space-y-2.5">
              <div className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Bồn Thủy Lực Xe 59C-882.14</span>
                <span className="font-mono text-primary font-bold">6.2 / 8.0 Tấn (77.5%)</span>
              </div>

              {/* Tank Bar */}
              <div className="relative h-7 w-full rounded-lg bg-slate-800 p-0.5 overflow-hidden flex items-center">
                <div 
                  className="h-full rounded bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500 transition-all flex items-center justify-end pr-2"
                  style={{ width: '77.5%' }}
                >
                  <span className="text-[9px] font-mono font-black text-white">77.5%</span>
                </div>
              </div>

              {/* 3 Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
                <div className="rounded-md bg-card border border-border p-1.5">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Áp Suất Bơm</div>
                  <div className="text-xs font-mono font-black text-foreground">210 Bar</div>
                </div>
                <div className="rounded-md bg-card border border-border p-1.5">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Nhiệt Dầu</div>
                  <div className="text-xs font-mono font-black text-foreground">58°C</div>
                </div>
                <div className="rounded-md bg-card border border-border p-1.5">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Chu Kỳ Nạp</div>
                  <div className="text-xs font-mono font-black text-foreground">18 Giây</div>
                </div>
              </div>
            </div>

            {/* 4 Urban Waste Zones (Super Compact) */}
            <div className="mt-3 space-y-1.5">
              {urbanZones.map((z, idx) => (
                <div key={idx} className="rounded-lg border border-border bg-card p-2 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{z.zone}</span>
                    <span className="font-mono font-bold text-foreground">{z.tons} ({z.percent}%)</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${z.color}`} style={{ width: `${z.percent}%` }} />
                  </div>
                  <div className="text-[10px] text-muted-foreground text-right">{z.tag}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tổng Gom: <strong className="text-foreground">11.0 / 15.5 Tấn</strong></span>
            <button onClick={() => onNavigateTab('SHIFTS')} className="font-bold text-primary hover:underline text-xs">
              Chi Tiết Tuyến →
            </button>
          </div>
        </div>

        {/* SƠ ĐỒ ĐÔ THỊ 03: MA TRẬN KÍP TRỰC 3 CA */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-black bg-violet-100 text-violet-800">
                  SƠ ĐỒ 03
                </span>
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  Ma Trận Kíp Trực 3 Ca
                </h2>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                8/8 Sẵn Sàng
              </span>
            </div>

            {/* 3 Shifts Switcher */}
            <div className="mt-3 grid grid-cols-3 gap-1.5 bg-muted/50 p-1 rounded-lg border border-border">
              <button
                onClick={() => setSelectedShiftView('MORNING')}
                className={`py-1 text-xs font-bold rounded transition-all text-center ${
                  selectedShiftView === 'MORNING' ? 'bg-card text-primary shadow-xs ring-1 ring-border' : 'text-muted-foreground'
                }`}
              >
                Sáng (04:30)
              </button>
              <button
                onClick={() => setSelectedShiftView('AFTERNOON')}
                className={`py-1 text-xs font-bold rounded transition-all text-center ${
                  selectedShiftView === 'AFTERNOON' ? 'bg-card text-primary shadow-xs ring-1 ring-border' : 'text-muted-foreground'
                }`}
              >
                Chiều (13:00)
              </button>
              <button
                onClick={() => setSelectedShiftView('NIGHT')}
                className={`py-1 text-xs font-bold rounded transition-all text-center ${
                  selectedShiftView === 'NIGHT' ? 'bg-card text-primary shadow-xs ring-1 ring-border' : 'text-muted-foreground'
                }`}
              >
                Đêm (21:00)
              </button>
            </div>

            {/* Dynamic Shift Cards (Minimal Text) */}
            <div className="mt-3 space-y-2">
              {selectedShiftView === 'MORNING' && (
                <>
                  <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-mono text-[10px] font-bold">59C-882.14</span>
                      <span className="font-bold text-foreground">Trục Lê Văn Việt</span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">Đang Chạy</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <div className="bg-card p-1.5 rounded border border-blue-100">
                        <div className="text-[10px] text-muted-foreground">Tài Xế (Bằng C)</div>
                        <div className="font-bold text-foreground">Võ Quốc Cường</div>
                      </div>
                      <div className="bg-card p-1.5 rounded border border-blue-100">
                        <div className="text-[10px] text-muted-foreground">Công Nhân (2)</div>
                        <div className="font-bold text-foreground">Tuấn • Long</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-1.5 py-0.5 rounded bg-amber-600 text-white font-mono text-[10px] font-bold">59C-912.05</span>
                      <span className="font-bold text-foreground">Đường Số 8</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">Đang Chạy</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <div className="bg-card p-1.5 rounded border border-amber-100">
                        <div className="text-[10px] text-muted-foreground">Tài Xế (Bằng C)</div>
                        <div className="font-bold text-foreground">Nguyễn Văn Long</div>
                      </div>
                      <div className="bg-card p-1.5 rounded border border-amber-100">
                        <div className="text-[10px] text-muted-foreground">Công Nhân</div>
                        <div className="font-bold text-foreground">Đặng Quốc Bảo</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedShiftView === 'AFTERNOON' && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px] font-bold">59C-774.20</span>
                    <span className="font-bold text-foreground">Tân Lập & Chợ</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">Chờ 13:00</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div className="bg-card p-1.5 rounded border border-emerald-100">
                      <div className="text-[10px] text-muted-foreground">Tài Xế (Bằng FC)</div>
                      <div className="font-bold text-foreground">Bùi Văn Hùng</div>
                    </div>
                    <div className="bg-card p-1.5 rounded border border-emerald-100">
                      <div className="text-[10px] text-muted-foreground">Công Nhân (2)</div>
                      <div className="font-bold text-foreground">Trí • Thắng</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedShiftView === 'NIGHT' && (
                <div className="rounded-lg border border-violet-200 bg-violet-50/40 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-violet-600 text-white font-mono text-[10px] font-bold">59C-663.88</span>
                    <span className="font-bold text-foreground">Vận Chuyển Đêm</span>
                    <span className="text-[10px] font-bold text-violet-700 bg-violet-100 px-1.5 py-0.2 rounded">Chờ 21:00</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div className="bg-card p-1.5 rounded border border-violet-100">
                      <div className="text-[10px] text-muted-foreground">Tài Xế Đêm</div>
                      <div className="font-bold text-foreground">Kíp Dự Phòng</div>
                    </div>
                    <div className="bg-card p-1.5 rounded border border-violet-100">
                      <div className="text-[10px] text-muted-foreground">Bảo Trì Thủy Lực</div>
                      <div className="font-bold text-foreground">Vũ Đình Trọng</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Minimal Safety Pill */}
              <div className="grid grid-cols-2 gap-1.5 text-xs pt-1">
                <div className="rounded border border-border bg-card p-2 text-center">
                  <div className="text-[10px] text-muted-foreground">Bảo Hộ Lao Động</div>
                  <div className="font-bold text-emerald-700">100% Đạt Chuẩn</div>
                </div>
                <div className="rounded border border-border bg-card p-2 text-center">
                  <div className="text-[10px] text-muted-foreground">Nồng Độ Cồn</div>
                  <div className="font-bold text-emerald-700 font-mono">0.00 mg/L</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Trực Kỹ Thuật: <strong className="text-emerald-700">2 Kỹ Sư</strong></span>
            <button onClick={() => onNavigateTab('ATTENDANCE')} className="font-bold text-primary hover:underline text-xs">
              Xem Chấm Công →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
