import React, { useState } from 'react';
import { 
  Clock, 
  PlusCircle, 
  CheckCircle2, 
  FileText, 
  X,
  Send
} from 'lucide-react';
import { EmployeeProfile, AttendanceRecord, LeaveRequest } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';

interface MyAttendanceTabProps {
  employee: EmployeeProfile;
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  onSubmitLeaveRequest?: (request: LeaveRequest) => void;
}

export const MyAttendanceTab: React.FC<MyAttendanceTabProps> = ({
  employee,
  attendanceRecords,
  leaveRequests,
  onSubmitLeaveRequest
}) => {
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState<'NGHI_PHEP_NAM' | 'NGHI_OM' | 'DOI_CA'>('NGHI_PHEP_NAM');
  const [startDate, setStartDate] = useState('25/09/2026');
  const [endDate, setEndDate] = useState('26/09/2026');
  const [reason, setReason] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const myAttendance = attendanceRecords.filter(r => r.employeeId === employee.id);
  const myLeaves = leaveRequests.filter(l => l.employeeId === employee.id);

  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const typeLabels: Record<string, string> = {
      NGHI_PHEP_NAM: 'Nghỉ phép năm',
      NGHI_OM: 'Nghỉ ốm',
      DOI_CA: 'Đổi ca'
    };

    const newReq: LeaveRequest = {
      id: `LVR-${Date.now().toString().slice(-6)}`,
      employeeId: employee.id,
      employeeName: employee.fullName,
      leaveType,
      leaveTypeLabel: typeLabels[leaveType],
      startDate,
      endDate,
      reason: reason || 'Việc gia đình',
      status: 'PENDING',
      submittedAt: new Date().toLocaleDateString('vi-VN')
    };

    if (onSubmitLeaveRequest) {
      onSubmitLeaveRequest(newReq);
    }

    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setShowLeaveModal(false);
      setReason('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* 4 Cards tóm tắt công lao động tháng */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
          <div className="text-xs font-bold uppercase text-muted-foreground">Công định mức</div>
          <div className="text-3xl font-black text-foreground mt-1">26 <span className="text-sm font-medium text-muted-foreground">ngày</span></div>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
          <div className="text-xs font-bold uppercase text-muted-foreground">Công thực tế</div>
          <div className="text-3xl font-black text-emerald-700 mt-1">
            26 <span className="text-sm font-medium text-muted-foreground">ngày</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
          <div className="text-xs font-bold uppercase text-muted-foreground">Tăng ca (OT)</div>
          <div className="text-3xl font-black text-[#004b93] mt-1">
            12 <span className="text-sm font-medium text-muted-foreground">giờ</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
          <div className="text-xs font-bold uppercase text-muted-foreground">Phép năm còn</div>
          <div className="text-3xl font-black text-amber-700 mt-1">
            10 / 12 <span className="text-sm font-medium text-muted-foreground">ngày</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-foreground tracking-tight">Nhật ký chấm công</h3>
        </div>
        <button
          onClick={() => setShowLeaveModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#004b93] text-white font-bold text-xs sm:text-sm shadow-sm hover:bg-[#003870] transition flex items-center gap-2"
        >
          <PlusCircle size={16} />
          Xin nghỉ phép / Đổi ca
        </button>
      </div>

      {/* Bảng lịch sử chấm công */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4">Ngày</th>
                <th className="py-3 px-4">Ca làm</th>
                <th className="py-3 px-4">Vào</th>
                <th className="py-3 px-4">Ra</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Tăng ca</th>
                <th className="py-3 px-4 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {myAttendance.length > 0 ? (
                myAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-muted/20 transition">
                    <td className="py-3.5 px-4 font-bold text-foreground whitespace-nowrap">
                      {rec.date}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground whitespace-nowrap">
                      {rec.shiftName.split('(')[0].trim()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {rec.checkIn}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-foreground whitespace-nowrap">
                      {rec.checkOut}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium">
                      {rec.workHours}h
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-[#004b93]">
                      {rec.overtimeHours > 0 ? `+${rec.overtimeHours}h` : '--'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <StatusBadge status={rec.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground text-sm">
                    Chưa có dữ liệu chấm công trong tháng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danh sách đơn xin nghỉ phép */}
      {myLeaves.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
          <h4 className="font-bold text-sm text-foreground uppercase tracking-wider text-muted-foreground">
            Đơn xin nghỉ & Đổi ca ({myLeaves.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myLeaves.map((req) => (
              <div key={req.id} className="p-3.5 rounded-xl border border-border bg-slate-50/60 flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-sm text-foreground">{req.leaveTypeLabel}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {req.startDate} → {req.endDate} ({req.reason})
                  </div>
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal nộp đơn xin nghỉ */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">Gửi đơn xin nghỉ phép / Đổi ca</h3>
              <button 
                onClick={() => setShowLeaveModal(false)}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            {formSubmitted ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
                <div className="font-bold text-sm text-foreground">Đã gửi đơn thành công!</div>
              </div>
            ) : (
              <form onSubmit={handleCreateLeave} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                    Hình thức
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-[#004b93]"
                  >
                    <option value="NGHI_PHEP_NAM">Nghỉ phép năm</option>
                    <option value="NGHI_OM">Nghỉ ốm (hưởng BHXH)</option>
                    <option value="DOI_CA">Xin đổi ca trực</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Từ ngày</label>
                    <input
                      type="text"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-[#004b93]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Đến ngày</label>
                    <input
                      type="text"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-[#004b93]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Lý do</label>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Lý do nghỉ hoặc ghi chú đổi ca..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#004b93]"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLeaveModal(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#004b93] text-white text-xs font-bold shadow hover:bg-[#003870] flex items-center gap-1.5"
                  >
                    <Send size={14} />
                    Gửi duyệt
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
