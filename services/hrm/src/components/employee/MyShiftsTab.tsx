import React, { useState } from 'react';
import { 
  Truck, 
  Clock, 
  Calendar, 
  Navigation, 
  CheckCircle2, 
  Radio
} from 'lucide-react';
import { EmployeeProfile, ShiftSchedule } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';

interface MyShiftsTabProps {
  employee: EmployeeProfile;
  shifts: ShiftSchedule[];
  onPunchIn?: (shiftId: string) => void;
}

export const MyShiftsTab: React.FC<MyShiftsTabProps> = ({ 
  employee, 
  shifts,
  onPunchIn 
}) => {
  const [punchStatus, setPunchStatus] = useState<string | null>(null);

  const myShifts = shifts.filter(
    s => s.driverId === employee.id || s.workerIds.includes(employee.id)
  );

  const currentShift = myShifts.find(s => s.status === 'IN_PROGRESS') || myShifts[0];

  const handleGpsPunch = () => {
    setPunchStatus('Đã điểm danh GPS lúc ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    setTimeout(() => {
      setPunchStatus(null);
    }, 3000);
    if (currentShift && onPunchIn) {
      onPunchIn(currentShift.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast alert */}
      {punchStatus && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold animate-fadeIn">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{punchStatus}</span>
        </div>
      )}

      {/* Ca làm việc trực tiếp hôm nay */}
      {currentShift ? (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#004b93] text-white">
                  <Radio size={13} className="animate-pulse" />
                  Hôm nay
                </span>
                <StatusBadge status={currentShift.status} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">
                  {currentShift.shiftName.split('(')[0].trim()} • {currentShift.routeCode}
                </h2>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="font-bold text-[#004b93] flex items-center gap-1">
                    <Clock size={15} />
                    {currentShift.timeRange}
                  </span>
                  <span>•</span>
                  <span>{currentShift.shiftDate}</span>
                </div>
              </div>

              {/* 4 Chỉ số nhanh */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="bg-slate-50 border border-border/80 p-3.5 rounded-xl">
                  <div className="text-xs text-muted-foreground font-semibold">Xe phụ trách</div>
                  <div className="font-mono font-black text-lg text-[#004b93] mt-0.5">
                    {currentShift.vehiclePlate}
                  </div>
                </div>

                <div className="bg-slate-50 border border-border/80 p-3.5 rounded-xl">
                  <div className="text-xs text-muted-foreground font-semibold">Bạn cùng ca</div>
                  <div className="font-bold text-base text-foreground truncate mt-0.5">
                    {employee.position === 'DRIVER' 
                      ? currentShift.workerNames[0] || '--'
                      : currentShift.driverName}
                  </div>
                </div>

                <div className="bg-slate-50 border border-border/80 p-3.5 rounded-xl">
                  <div className="text-xs text-muted-foreground font-semibold">Điểm gom</div>
                  <div className="font-black text-lg text-foreground mt-0.5">
                    {currentShift.assignedBinsCount} <span className="text-xs font-normal text-muted-foreground">thùng</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-border/80 p-3.5 rounded-xl">
                  <div className="text-xs text-muted-foreground font-semibold">Rác đã nạp</div>
                  <div className="font-black text-lg text-emerald-700 mt-0.5">
                    {currentShift.tonnageCollected || 0} <span className="text-xs font-normal text-muted-foreground">tấn</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Nút điểm danh GPS */}
            <div className="shrink-0 flex items-center">
              <button
                onClick={handleGpsPunch}
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-[#004b93] text-white font-black text-sm shadow-md hover:bg-[#003870] active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <Navigation size={18} />
                Điểm danh GPS
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-card rounded-2xl border border-border">
          <Clock size={32} className="mx-auto text-muted-foreground/40 mb-2" />
          <h3 className="font-bold text-base text-foreground">Hôm nay không có ca trực</h3>
        </div>
      )}

      {/* Lịch ca trong kỳ */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[#004b93]" />
            <h3 className="text-lg font-black text-foreground tracking-tight">Lịch ca làm việc</h3>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">
            {myShifts.length} ca
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4">Ngày</th>
                <th className="py-3 px-4">Ca</th>
                <th className="py-3 px-4">Giờ</th>
                <th className="py-3 px-4">Tuyến gom</th>
                <th className="py-3 px-4">Xe</th>
                <th className="py-3 px-4">Đồng đội</th>
                <th className="py-3 px-4 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {myShifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-muted/20 transition">
                  <td className="py-3.5 px-4 font-bold text-foreground whitespace-nowrap">
                    {shift.shiftDate}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-foreground whitespace-nowrap">
                    {shift.shiftName.split('(')[0].trim()}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-[#004b93] font-bold whitespace-nowrap">
                    {shift.timeRange}
                  </td>
                  <td className="py-3.5 px-4 text-foreground whitespace-nowrap">
                    <span className="font-bold text-xs bg-slate-100 px-2 py-0.5 rounded mr-2">{shift.routeCode}</span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {shift.routeName.replace('Tuyến ', '').split('&')[0].trim()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground whitespace-nowrap">
                    {shift.vehiclePlate}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-foreground whitespace-nowrap">
                    {employee.position === 'DRIVER' 
                      ? shift.workerNames[0] || '--'
                      : shift.driverName}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <StatusBadge status={shift.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
