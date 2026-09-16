import React, { useState } from 'react';
import { 
  UserX, 
  CheckCircle2, 
  AlertOctagon, 
  Send, 
  RotateCcw, 
  Navigation, 
  Search, 
  FileText,
  Radio,
  CheckCircle
} from 'lucide-react';
import { SuspensionCase, SuspensionStatus } from '../../types';
import { formatVND } from '../../lib/utils';
import { StatusBadge } from '../shared/StatusBadge';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface ServiceSuspensionTabProps {
  cases: SuspensionCase[];
  onApproveSuspension: (caseId: string) => void;
  onRestoreService: (caseId: string) => void;
}

export const ServiceSuspensionTab: React.FC<ServiceSuspensionTabProps> = ({
  cases,
  onApproveSuspension,
  onRestoreService
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<SuspensionCase | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'RESTORE' | null>(null);

  const filteredCases = cases.filter(c => {
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.householdName.toLowerCase().includes(q) ||
        c.householdId.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.binId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleConfirmAction = () => {
    if (!selectedCase || !actionType) return;
    if (actionType === 'APPROVE') {
      onApproveSuspension(selectedCase.id);
      alert(`Đã duyệt tạm ngừng dịch vụ đối với ${selectedCase.householdName}! Đã tự động phát thông báo niêm phong và gỡ điểm thu gom khỏi lộ trình GPS Xe Rác Traccar.`);
    } else if (actionType === 'RESTORE') {
      onRestoreService(selectedCase.id);
      alert(`Đã khôi phục dịch vụ thu gom rác cho ${selectedCase.householdName}! Lộ trình xe rác GPS đã được cập nhật lại điểm đón.`);
    }
    setSelectedCase(null);
    setActionType(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Quản Lý Tạm Ngừng & Khôi Phục Dịch Vụ
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Chế tài tạm ngừng thu gom rác quá hạn và đồng bộ tuyến xe rác GPS Traccar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800 flex items-center gap-2 shadow-sm whitespace-nowrap">
            <Radio size={14} className="text-blue-600 animate-pulse" />
            <span>Traccar Sync: Tuyến GPS</span>
          </div>
        </div>
      </div>

      {/* Policy Card Banner */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <AlertOctagon size={17} className="text-rose-600" />
          Chính Sách Chế Tài Tạm Ngừng Dịch Vụ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2.5 text-xs">
          <div className="p-3 bg-muted/40 rounded-xl border border-border">
            <span className="font-bold text-foreground block">1. Điều Kiện Xem Xét</span>
            <p className="text-muted-foreground mt-0.5 leading-relaxed">
              Nợ quá hạn trên 30 ngày và đã gửi đủ 3 lượt thông báo đôn đốc.
            </p>
          </div>
          <div className="p-3 bg-muted/40 rounded-xl border border-border">
            <span className="font-bold text-foreground block">2. Quy Trình Tạm Ngừng</span>
            <p className="text-muted-foreground mt-0.5 leading-relaxed">
              Quản lý duyệt ➔ Gửi văn bản niêm phong ➔ Loại trừ tọa độ trên GPS xe rác.
            </p>
          </div>
          <div className="p-3 bg-muted/40 rounded-xl border border-border">
            <span className="font-bold text-foreground block">3. Khôi Phục Dịch Vụ</span>
            <p className="text-muted-foreground mt-0.5 leading-relaxed">
              Hộ dân thanh toán đủ nợ ➔ Hệ thống tự động gỡ phong tỏa trong 24h.
            </p>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo tên hộ, địa chỉ, mã thùng rác..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-input bg-card pl-9 pr-3 py-2 text-xs font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">Mọi trạng thái hồ sơ</option>
              <option value="PROPOSED">Chờ Quản lý phê duyệt</option>
              <option value="SUSPENDED">Đang tạm ngừng phục vụ</option>
              <option value="RESTORED">Đã khôi phục dịch vụ</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-bold">
              <tr>
                <th className="px-3 py-2.5">Mã Hồ Sơ</th>
                <th className="px-3 py-2.5">Chủ Hộ & Địa Chỉ</th>
                <th className="px-3 py-2.5">Mã Thùng</th>
                <th className="px-3 py-2.5">Tổng Nợ / Trễ</th>
                <th className="px-3 py-2.5">Trạng Thái</th>
                <th className="px-3 py-2.5">Thông Báo</th>
                <th className="px-3 py-2.5">GPS Xe Rác</th>
                <th className="px-3 py-2.5 text-right">Quyết Định</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCases.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-mono font-bold text-rose-700 whitespace-nowrap">
                    {c.id}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-bold text-foreground whitespace-nowrap">{c.householdName}</div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">{c.address}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5 whitespace-nowrap">{c.householdId}</div>
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-primary whitespace-nowrap">
                    {c.binId}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="font-mono font-black text-rose-600">{formatVND(c.totalDebt)}</div>
                    <div className="text-[11px] text-muted-foreground">Quá hạn {c.overdueDays} ngày</div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <StatusBadge 
                      status={c.status} 
                      label={
                        c.status === 'PROPOSED' ? 'Chờ duyệt' :
                        c.status === 'SUSPENDED' ? 'Tạm ngừng' :
                        'Đã khôi phục'
                      } 
                    />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {c.noticeSent ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <CheckCircle size={14} /> Đã gửi
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Chưa gửi</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {c.traccarBlacklistSynced ? (
                      <span className="inline-flex items-center gap-1 font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full ring-1 ring-rose-200">
                        <Navigation size={12} /> Bỏ qua GPS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                        Bình thường
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    {c.status === 'PROPOSED' && (
                      <button
                        onClick={() => {
                          setSelectedCase(c);
                          setActionType('APPROVE');
                        }}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-sm"
                      >
                        Duyệt Tạm Ngừng
                      </button>
                    )}
                    {c.status === 'SUSPENDED' && (
                      <button
                        onClick={() => {
                          setSelectedCase(c);
                          setActionType('RESTORE');
                        }}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm inline-flex items-center gap-1"
                      >
                        <RotateCcw size={12} />
                        <span>Khôi Phục</span>
                      </button>
                    )}
                    {c.status === 'RESTORED' && (
                      <span className="text-[11px] font-bold text-emerald-700">
                        Đang hoạt động tốt
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(selectedCase && actionType)}
        onClose={() => {
          setSelectedCase(null);
          setActionType(null);
        }}
        onConfirm={handleConfirmAction}
        variant={actionType === 'APPROVE' ? 'danger' : 'success'}
        title={
          actionType === 'APPROVE' 
            ? `Phê duyệt tạm ngừng dịch vụ: ${selectedCase?.householdName}` 
            : `Khôi phục dịch vụ thu gom rác: ${selectedCase?.householdName}`
        }
        description={
          actionType === 'APPROVE'
            ? `Hành động này sẽ: 1. Phát hành quyết định tạm ngừng thu gom rác; 2. Gửi thông báo chính thức đến người dân; 3. Đồng bộ blacklist sang hệ thống GPS Traccar để xe gom rác bỏ qua địa chỉ này.`
            : `Hành động này sẽ xóa hộ dân khỏi danh sách đen, kích hoạt lại thùng rác thông minh ${selectedCase?.binId} và tự động thêm lại điểm thu gom vào lộ trình xe rác Traccar.`
        }
        confirmLabel={actionType === 'APPROVE' ? 'Xác Nhận Tạm Ngừng' : 'Xác Nhận Khôi Phục'}
      />
    </div>
  );
};
