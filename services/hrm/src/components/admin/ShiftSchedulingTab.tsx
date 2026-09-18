import React, { useState } from 'react';
import { 
  CalendarClock, 
  Plus, 
  Truck, 
  UserCheck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Search, 
  Filter, 
  X,
  Sparkles
} from 'lucide-react';
import { ShiftSchedule, ShiftType, EmployeeProfile } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';

interface ShiftSchedulingTabProps {
  shifts: ShiftSchedule[];
  employees: EmployeeProfile[];
  onAddShift: (newShift: ShiftSchedule) => void;
}

export const ShiftSchedulingTab: React.FC<ShiftSchedulingTabProps> = ({
  shifts,
  employees,
  onAddShift
}) => {
  const [filterDate, setFilterDate] = useState('17/09/2026');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New shift form state
  const [shiftType, setShiftType] = useState<ShiftType>('MORNING');
  const [shiftDate, setShiftDate] = useState('18/09/2026');
  const [routeName, setRouteName] = useState('Tuyến Lê Văn Việt & Man Thiện');
  const [vehiclePlate, setVehiclePlate] = useState('59C-882.14');
  const [selectedDriverId, setSelectedDriverId] = useState('DVR-09201');
  const [selectedWorkerId, setSelectedWorkerId] = useState('WRK-09305');
  const [assignedBins, setAssignedBins] = useState(48);

  const drivers = employees.filter(e => e.position === 'DRIVER');
  const workers = employees.filter(e => e.position === 'SANITATION_WORKER');

  const filteredShifts = shifts.filter((s) => {
    if (filterType !== 'ALL' && s.shiftType !== filterType) return false;
    return true;
  });

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    const driver = employees.find(e => e.id === selectedDriverId);
    const worker = employees.find(e => e.id === selectedWorkerId);

    const timeMap: Record<ShiftType, string> = {
      MORNING: '04:30 - 11:30',
      AFTERNOON: '13:00 - 20:00',
      NIGHT: '21:30 - 04:30'
    };

    const nameMap: Record<ShiftType, string> = {
      MORNING: `Ca Sáng (${routeName.split('&')[0]})`,
      AFTERNOON: `Ca Chiều (${routeName.split('&')[0]})`,
      NIGHT: `Ca Đêm (${routeName.split('&')[0]})`
    };

    const newShift: ShiftSchedule = {
      id: `SFT-202609-${Math.floor(100 + Math.random() * 900)}`,
      shiftDate,
      shiftType,
      shiftName: nameMap[shiftType],
      timeRange: timeMap[shiftType],
      routeCode: `ROUTE-HP-0${Math.floor(1 + Math.random() * 5)}`,
      routeName,
      vehiclePlate,
      driverId: selectedDriverId,
      driverName: driver?.fullName || 'Tài xế',
      workerIds: [selectedWorkerId],
      workerNames: [worker?.fullName || 'Công nhân phụ xe'],
      assignedBinsCount: assignedBins,
      status: 'SCHEDULED',
      notes: 'Lịch phân ca mới bổ sung'
    };

    onAddShift(newShift);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Phân Ca & Lộ Trình Xe Ép
          </h1>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary/90 transition-all active:scale-95"
        >
          <Plus size={16} />
          <span>Xếp Ca Mới</span>
        </button>
      </div>

      {/* Shift Overview Cards (3 Shift Slots) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-black text-primary ring-1 ring-blue-200">
              CA SÁNG
            </span>
            <span className="text-xs font-mono font-bold text-muted-foreground">04:30 - 11:30</span>
          </div>
          <div className="mt-2 text-xl font-black text-foreground">2 Tổ Xe Đang Chạy</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-black text-amber-800 ring-1 ring-amber-200">
              CA CHIỀU
            </span>
            <span className="text-xs font-mono font-bold text-muted-foreground">13:00 - 20:00</span>
          </div>
          <div className="mt-2 text-xl font-black text-foreground">1 Tổ Xe Sẵn Sàng</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-black text-purple-800 ring-1 ring-purple-200">
              CA ĐÊM
            </span>
            <span className="text-xs font-mono font-bold text-muted-foreground">21:30 - 04:30</span>
          </div>
          <div className="mt-2 text-xl font-black text-foreground">1 Tổ Xe Trực Đêm</div>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarClock size={18} className="text-primary" />
            <span className="font-bold text-sm text-foreground">Bảng Phân Công Ca & Tuyến Xe</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">Tất cả các ca</option>
              <option value="MORNING">Chỉ ca sáng (04:30)</option>
              <option value="AFTERNOON">Chỉ ca chiều (13:00)</option>
              <option value="NIGHT">Chỉ ca đêm (21:30)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-bold">
              <tr>
                <th className="px-3 py-2.5">Mã Ca</th>
                <th className="px-3 py-2.5">Ngày & Khung Giờ</th>
                <th className="px-3 py-2.5">Tuyến Đường Thu Gom</th>
                <th className="px-3 py-2.5">Xe Ép Rác</th>
                <th className="px-3 py-2.5">Tài Xế Phụ Trách</th>
                <th className="px-3 py-2.5">Công Nhân Phụ Xe</th>
                <th className="px-3 py-2.5">Điểm Gom</th>
                <th className="px-3 py-2.5 pr-4 text-right">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredShifts.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-mono font-bold text-primary whitespace-nowrap">
                    {s.id}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="font-bold text-foreground">{s.shiftDate}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">{s.timeRange}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-bold text-foreground whitespace-nowrap">{s.routeName}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{s.routeCode}</div>
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                    {s.vehiclePlate}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-bold text-foreground">
                    {s.driverName}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                    {s.workerNames.join(', ')}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono font-bold text-foreground">
                    {s.assignedBinsCount} thùng
                  </td>
                  <td className="px-3 py-2.5 pr-4 text-right whitespace-nowrap">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Xếp Ca Mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-slate-50">
              <h3 className="text-base font-bold text-foreground">
                Xếp Ca Trực & Tuyến Đường Mới
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Ngày làm việc</label>
                  <input
                    type="text"
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-mono font-medium focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Ca làm việc</label>
                  <select
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value as ShiftType)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-ring"
                  >
                    <option value="MORNING">Ca Sáng (04:30 - 11:30)</option>
                    <option value="AFTERNOON">Ca Chiều (13:00 - 20:00)</option>
                    <option value="NIGHT">Ca Đêm (21:30 - 04:30)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-foreground block mb-1">Tuyến đường thu gom</label>
                  <input
                    type="text"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Xe ép rác phụ trách</label>
                  <select
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-ring"
                  >
                    <option value="59C-882.14">59C-882.14 (Xe 8 tấn)</option>
                    <option value="59C-912.05">59C-912.05 (Xe 10 tấn)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Số thùng SmartBin</label>
                  <input
                    type="number"
                    value={assignedBins}
                    onChange={(e) => setAssignedBins(parseInt(e.target.value, 10) || 40)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-mono font-medium focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Tài xế chính</label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-ring"
                  >
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.fullName} ({d.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Công nhân phụ xe</label>
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-ring"
                  >
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.fullName} ({w.id})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 shadow-md"
                >
                  Lưu & Phát Lệnh Ca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
