import React, { useState } from 'react';
import { 
  BellRing, 
  Send, 
  AlertTriangle, 
  Clock, 
  UserCheck, 
  Search, 
  ChevronRight,
  MessageSquare,
  FileWarning,
  ArrowRight
} from 'lucide-react';
import { DunningRecord, DunningTier } from '../../types';
import { formatVND } from '../../lib/utils';
import { StatusBadge } from '../shared/StatusBadge';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface DunningRemindersTabProps {
  records: DunningRecord[];
  onSendBulkReminders: () => void;
  onEscalateCase: (recordId: string) => void;
  onNavigateToSuspension: () => void;
}

export const DunningRemindersTab: React.FC<DunningRemindersTabProps> = ({
  records,
  onSendBulkReminders,
  onEscalateCase,
  onNavigateToSuspension
}) => {
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const filteredRecords = records.filter(r => {
    if (filterTier !== 'ALL' && r.currentTier !== filterTier) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.householdName.toLowerCase().includes(q) ||
        r.householdId.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleBulkSend = () => {
    setIsSending(true);
    setTimeout(() => {
      onSendBulkReminders();
      setIsSending(false);
      alert('Đã gửi thông báo nhắc nợ đa kênh (Zalo ZNS & SMS) đến toàn bộ các hộ dân quá hạn!');
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Nhắc Phí & Cảnh Báo Nợ Quá Hạn
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Chu kỳ đôn đốc thanh toán đa kênh tự động và kiểm soát chuyển hồ sơ quá hạn.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateToSuspension}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-bold text-rose-700 shadow-sm hover:bg-rose-100 transition-colors"
          >
            <FileWarning size={16} />
            <span>Xem Danh Sách Đề Xuất Tạm Ngừng</span>
          </button>

          <button
            onClick={() => setConfirmSendOpen(true)}
            disabled={isSending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
          >
            <Send size={16} />
            <span>Gửi Nhắc Phí Hàng Loạt</span>
          </button>
        </div>
      </div>

      {/* 5 Standard Municipal Dunning Milestone Timeline */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Clock size={18} className="text-primary" />
          Quy Trình 5 Mốc Nhắc Nợ Chuẩn Đô Thị Thông Minh
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          {/* Mốc T-3 */}
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
            <span className="rounded-md bg-blue-100 px-2 py-0.5 font-bold text-blue-800 text-[10px]">
              MỐC T-3 (Ngày 12)
            </span>
            <div className="font-bold text-foreground mt-2">Thông báo kỳ phí</div>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              Gửi thông báo Zalo ZNS / App Push nhắc kỳ nộp phí sắp đến hạn.
            </p>
          </div>

          {/* Mốc T */}
          <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200">
            <span className="rounded-md bg-indigo-100 px-2 py-0.5 font-bold text-indigo-800 text-[10px]">
              MỐC T (Ngày 15)
            </span>
            <div className="font-bold text-foreground mt-2">Hạn chót thanh toán</div>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              Tự động kích hoạt lệnh trích nợ tự động hoặc gửi mã VietQR nộp nhanh.
            </p>
          </div>

          {/* Mốc T+5 */}
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
            <span className="rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-800 text-[10px]">
              MỐC T+5 (Ngày 20)
            </span>
            <div className="font-bold text-foreground mt-2">Cảnh báo cấp 1</div>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              SMS trực tiếp số điện thoại chủ hộ nhắc nợ quá hạn lần đầu.
            </p>
          </div>

          {/* Mốc T+15 */}
          <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200">
            <span className="rounded-md bg-orange-100 px-2 py-0.5 font-bold text-orange-800 text-[10px]">
              MỐC T+15 (Ngày 30)
            </span>
            <div className="font-bold text-foreground mt-2">Cảnh báo cấp 2</div>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              Thông báo nguy cơ niêm phong thùng rác và ngưng lấy rác tại nhà.
            </p>
          </div>

          {/* Mốc T+30 */}
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 ring-2 ring-rose-200">
            <span className="rounded-md bg-rose-200 px-2 py-0.5 font-black text-rose-900 text-[10px]">
              MỐC T+30 (NGƯỠNG ĐỎ)
            </span>
            <div className="font-black text-rose-700 mt-2">Chuyển Hồ Sơ Quản Lý</div>
            <p className="text-rose-900 text-[11px] mt-0.5 font-medium">
              Chuyển cấp thẩm quyền phê duyệt Tạm ngừng thu gom rác.
            </p>
          </div>
        </div>
      </div>

      {/* Dunning Records Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo tên hộ, số ĐT, địa chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-input bg-card pl-9 pr-3 py-2 text-xs font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">Tất cả các mốc quá hạn</option>
              <option value="T_PLUS_30_CRITICAL">Quá hạn trên 30 ngày (Ngưỡng nguy cơ)</option>
              <option value="T_PLUS_15">Quá hạn 15 ngày</option>
              <option value="T_PLUS_5">Quá hạn 5 ngày</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[960px]">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-bold">
              <tr>
                <th className="px-3 py-2.5">Hồ Sơ Nợ</th>
                <th className="px-3 py-2.5">Hộ Dân & Địa Chỉ</th>
                <th className="px-3 py-2.5">Quá Hạn</th>
                <th className="px-3 py-2.5">Số Kỳ</th>
                <th className="px-3 py-2.5">Tổng Nợ</th>
                <th className="px-3 py-2.5">Mốc Cảnh Báo</th>
                <th className="px-3 py-2.5">Trạng Thái</th>
                <th className="px-3 py-2.5 pr-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-mono font-bold text-primary whitespace-nowrap">
                    {rec.id}
                  </td>
                  <td className="px-3 py-2.5 min-w-[210px]">
                    <div className="font-bold text-foreground whitespace-nowrap">{rec.householdName}</div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[210px]">{rec.address}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">
                      {rec.phone} • Nhắc: {rec.lastReminderSent}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="font-mono text-sm font-black text-rose-600">
                      {rec.overdueDays} ngày
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-bold text-foreground">
                    {rec.unpaidCount} tháng
                  </td>
                  <td className="px-3 py-2.5 font-mono font-black text-rose-600 whitespace-nowrap">
                    {formatVND(rec.totalDebt)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      rec.currentTier === 'T_PLUS_30_CRITICAL' 
                        ? 'bg-rose-100 text-rose-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rec.tierLabel}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {rec.escalatedToManager ? (
                      <span className="rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 font-black text-[11px] ring-1 ring-rose-300 inline-flex items-center gap-1">
                        <AlertTriangle size={11} /> Đã chuyển QL
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">Đang nhắc</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 pr-4 text-right whitespace-nowrap">
                    {rec.currentTier === 'T_PLUS_30_CRITICAL' && !rec.escalatedToManager && (
                      <button
                        onClick={() => onEscalateCase(rec.id)}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-sm"
                      >
                        Chuyển Quản Lý Duyệt Tạm Ngừng
                      </button>
                    )}
                    {rec.escalatedToManager && (
                      <button
                        onClick={onNavigateToSuspension}
                        className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold text-primary hover:bg-muted inline-flex items-center gap-1"
                      >
                        <span>Hồ sơ tạm ngừng</span>
                        <ArrowRight size={12} />
                      </button>
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
        isOpen={confirmSendOpen}
        onClose={() => setConfirmSendOpen(false)}
        onConfirm={handleBulkSend}
        title="Gửi thông báo nhắc nợ đồng loạt"
        description="Hệ thống sẽ gửi tin nhắn Zalo ZNS và SMS thông báo nợ tự động đến toàn bộ các hộ dân đang trong danh sách nợ quá hạn theo đúng mẫu công văn quy định của phường."
        confirmLabel="Gửi Thông Báo Ngay"
      />
    </div>
  );
};
