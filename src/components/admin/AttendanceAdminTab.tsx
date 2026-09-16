import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle, 
  MapPin, 
  CalendarCheck, 
  CheckCircle2, 
  XCircle, 
  FileCheck, 
  Search, 
  Filter 
} from 'lucide-react';
import { AttendanceRecord, LeaveRequest } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';

interface AttendanceAdminTabProps {
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  onApproveLeave: (id: string) => void;
  onRejectLeave: (id: string) => void;
}

export const AttendanceAdminTab: React.FC<AttendanceAdminTabProps> = ({
  attendance,
  leaveRequests,
  onApproveLeave,
  onRejectLeave
}) => {
  const [filterDate, setFilterDate] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAttendance = attendance.filter((a) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.employeeName.toLowerCase().includes(q) ||
        a.employeeId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Chấm Công & Điểm Danh GPS
          </h1>
        </div>

        <button
          onClick={() => alert("Đã chốt bảng chấm công tháng 09/2026 thành công và đồng bộ sang Bảng Lương!")}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-all active:scale-95"
        >
          <FileCheck size={16} />
          <span>Chốt Công Kỳ 09/2026</span>
        </button>
      </div>

      {/* Pending Leave Requests Section */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Đơn Xin Nghỉ & Đổi Ca Chờ Duyệt ({leaveRequests.filter(l => l.status === 'PENDING').length})
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {leaveRequests.map((l) => (
            <div key={l.id} className="p-3.5 rounded-xl border border-border bg-muted/20 flex flex-col justify-between space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-foreground text-xs">{l.employeeName} ({l.employeeId})</div>
                  <span className="rounded bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 text-[10px]">
                    {l.leaveTypeLabel}
                  </span>
                </div>
                <StatusBadge status={l.status} />
              </div>

              <div className="text-xs space-y-0.5">
                <div className="text-muted-foreground">Thời gian: <strong className="text-foreground">{l.startDate} ➔ {l.endDate}</strong></div>
                <div className="text-muted-foreground">Lý do: <span className="text-foreground">{l.reason}</span></div>
              </div>

              {l.status === 'PENDING' && (
                <div className="pt-2 border-t border-border flex items-center justify-end gap-2">
                  <button
                    onClick={() => onRejectLeave(l.id)}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => onApproveLeave(l.id)}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                  >
                    Duyệt đơn
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo tên nhân viên, mã số..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-input bg-card pl-9 pr-3 py-2 text-xs font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-bold">
              <tr>
                <th className="px-3 py-2.5">Mã</th>
                <th className="px-3 py-2.5">Ngày</th>
                <th className="px-3 py-2.5">Họ & Tên</th>
                <th className="px-3 py-2.5">Ca Làm</th>
                <th className="px-3 py-2.5">Vào</th>
                <th className="px-3 py-2.5">Ra</th>
                <th className="px-3 py-2.5">Số Giờ</th>
                <th className="px-3 py-2.5">Tăng Ca</th>
                <th className="px-3 py-2.5 pr-4 text-right">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAttendance.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-mono font-bold text-primary whitespace-nowrap">
                    {a.id}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono">
                    {a.date}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="font-bold text-foreground">{a.employeeName}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{a.employeeId}</div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-medium text-foreground">
                    {a.shiftName}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono font-bold text-emerald-700">
                    {a.checkIn}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono font-bold text-slate-700">
                    {a.checkOut}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono font-bold text-foreground">
                    {a.workHours}h
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono font-bold text-amber-700">
                    {a.overtimeHours > 0 ? `+${a.overtimeHours}h` : '0h'}
                  </td>
                  <td className="px-3 py-2.5 pr-4 text-right whitespace-nowrap">
                    <StatusBadge status={a.status} />
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
