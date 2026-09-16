import React, { useState } from 'react';
import { 
  Scale, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  FileSpreadsheet, 
  Search, 
  ArrowUpRight,
  Fingerprint,
  Lock
} from 'lucide-react';
import { ReconciliationEntry, ReconciliationBatch } from '../../types';
import { formatVND } from '../../lib/utils';
import { StatusBadge } from '../shared/StatusBadge';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface ReconciliationTabProps {
  entries: ReconciliationEntry[];
  batch: ReconciliationBatch;
  onRunReconciliation: () => void;
}

export const ReconciliationTab: React.FC<ReconciliationTabProps> = ({
  entries,
  batch,
  onRunReconciliation
}) => {
  const [isReconciling, setIsReconciling] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmReconcileOpen, setConfirmReconcileOpen] = useState(false);
  const [detailEntry, setDetailEntry] = useState<ReconciliationEntry | null>(null);

  const filteredEntries = entries.filter((e) => {
    if (filterStatus !== 'ALL' && e.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.householdName.toLowerCase().includes(q) ||
        e.transactionRef.toLowerCase().includes(q) ||
        e.invoiceId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStartReconciliation = () => {
    setIsReconciling(true);
    setTimeout(() => {
      onRunReconciliation();
      setIsReconciling(false);
      alert('Đối soát hoàn tất! Hệ thống đã tự động gạch nợ 479 giao dịch và chặn 2 giao dịch chuyển khoản trùng lặp.');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Xác Nhận & Đối Soát Thanh Toán
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Đối chiếu 3 chiều giữa Hóa đơn, Sao kê ngân hàng và Cổng thanh toán trực tuyến.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => alert("Đã nạp file sao kê ngân hàng MT940 thành công!")}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-bold text-foreground shadow-sm hover:bg-muted transition-colors"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            <span>Nạp Sao Kê Ngân Hàng</span>
          </button>

          <button
            onClick={() => setConfirmReconcileOpen(true)}
            disabled={isReconciling}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {isReconciling ? <RefreshCw size={16} className="animate-spin" /> : <Scale size={16} />}
            <span>Chạy Đối Soát Tự Động</span>
          </button>
        </div>
      </div>

      {/* Batch Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Giao Dịch Đã Khớp 100%</span>
            <CheckCircle size={18} className="text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-emerald-600">
            {batch.matchedCount} / {batch.totalSystemInvoices}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Đã tự động xác nhận và gạch nợ hóa đơn trên hệ thống.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700">Đã Chặn Trùng Lặp</span>
            <Lock size={18} className="text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-purple-700">
            {batch.duplicatePreventedCount} giao dịch
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Phát hiện chuyển trùng qua Idempotency Key, đã giữ tiền chờ hoàn trả.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-700">Lệch Số Tiền / Cần Xử Lý</span>
            <AlertTriangle size={18} className="text-orange-600" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-orange-700">
            {batch.discrepancyCount} trường hợp
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Cần kế toán đối chiếu tay do chênh lệch voucher khuyến mãi.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Tổng Tiền Quyết Toán Kỳ</span>
            <ShieldCheck size={18} className="text-primary" />
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-foreground">
            {formatVND(batch.totalSettledAmount)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Đã kiểm toán và đối soát hoàn tất với Ngân hàng Vietcombank.
          </p>
        </div>
      </div>

      {/* Anti-Duplication Algorithm Technical Highlight Banner */}
      <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 shadow-sm flex items-start gap-3.5">
        <Fingerprint className="text-purple-700 h-6 w-6 shrink-0 mt-0.5" />
        <div className="text-xs text-purple-950 leading-relaxed">
          <strong className="text-sm font-bold text-purple-900 block">Cơ chế Kiểm soát chống ghi nhận trùng lặp (Anti-Duplication Guard)</strong>
          Mỗi giao dịch ngân hàng hoặc VietQR đều được tính toán một khóa định danh duy nhất (Idempotency Hash = MD5(Mã Hóa Đơn + Số Tài Khoản + Thời Gian GD)). Nếu người dân chuyển khoản 2 lần liên tiếp cho cùng 1 hóa đơn, hệ thống sẽ tự động bắt giữ giao dịch lặp, không gạch nợ 2 lần và đưa vào danh sách hoàn tiền minh bạch.
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo mã GD, mã HĐ, tên chủ hộ..."
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
              <option value="ALL">Mọi kết quả đối soát</option>
              <option value="MATCHED">Khớp 100% (Gạch nợ xong)</option>
              <option value="DUPLICATE_FLAGGED">Đã chặn trùng lặp</option>
              <option value="MISMATCH_AMOUNT">Lệch số tiền</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[960px]">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-bold">
              <tr>
                <th className="px-3 py-2.5">Mã Giao Dịch</th>
                <th className="px-3 py-2.5">Mã Hóa Đơn</th>
                <th className="px-3 py-2.5">Hộ Dân & Kênh Thu</th>
                <th className="px-3 py-2.5">Tiền Hóa Đơn</th>
                <th className="px-3 py-2.5">Tiền Ngân Hàng Báo</th>
                <th className="px-3 py-2.5">Chênh Lệch</th>
                <th className="px-3 py-2.5">Kết Quả Đối Soát</th>
                <th className="px-3 py-2.5">Khóa Hash Kiểm Toán</th>
                <th className="px-3 py-2.5 pr-4 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-mono font-bold text-primary whitespace-nowrap">
                    {entry.transactionRef}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {entry.invoiceId}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-bold text-foreground">{entry.householdName}</div>
                    <div className="text-[11px] text-muted-foreground">{entry.channel}</div>
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-foreground whitespace-nowrap">
                    {formatVND(entry.systemAmount)}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-foreground whitespace-nowrap">
                    {formatVND(entry.bankAmount)}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold whitespace-nowrap">
                    {entry.diffAmount === 0 ? (
                      <span className="text-emerald-700">0 đ</span>
                    ) : (
                      <span className="text-rose-600">{formatVND(entry.diffAmount)}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <StatusBadge status={entry.status} />
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                    {entry.antiDuplicationHash}
                  </td>
                  <td className="px-3 py-2.5 pr-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setDetailEntry(entry)}
                      className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/5 transition-colors"
                    >
                      Kiểm toán
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Detail Modal */}
      {detailEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Fingerprint className="text-primary" size={24} />
                <h3 className="text-lg font-bold text-foreground">Hồ Sơ Đối Soát Giao Dịch</h3>
              </div>
              <StatusBadge status={detailEntry.status} />
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã GD Ngân Hàng:</span>
                  <span className="font-bold text-foreground">{detailEntry.transactionRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã Hóa Đơn Hệ Thống:</span>
                  <span className="font-bold text-primary">{detailEntry.invoiceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chủ Hộ:</span>
                  <span className="font-bold text-foreground font-sans">{detailEntry.householdName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kênh Thanh Toán:</span>
                  <span className="text-slate-700 font-sans">{detailEntry.channel}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span>Thời gian ghi nhận ngân hàng:</span>
                  <strong className="font-mono">{detailEntry.bankTimestamp}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Thời gian hệ thống xác nhận:</span>
                  <strong className="font-mono">{detailEntry.systemTimestamp}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Người / Hệ thống duyệt:</span>
                  <strong className="text-primary">{detailEntry.auditedBy}</strong>
                </div>
              </div>

              {detailEntry.note && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 leading-relaxed">
                  <strong>Ghi Chú Kiểm Soát:</strong> {detailEntry.note}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDetailEntry(null)}
                className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  alert(`Đã xuất biên lai điện tử VAT cho giao dịch ${detailEntry.transactionRef}`);
                  setDetailEntry(null);
                }}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90"
              >
                Xuất Biên Lai VAT Điện Tử
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmReconcileOpen}
        onClose={() => setConfirmReconcileOpen(false)}
        onConfirm={handleStartReconciliation}
        title="Chạy đối soát thanh toán tự động"
        description="Hệ thống sẽ nạp toàn bộ giao dịch từ Vietcombank & VietQR Napas trong ngày, kiểm tra mã Idempotency chống trùng lặp và tự động cập nhật trạng thái đã thanh toán cho các hộ dân."
        confirmLabel="Khởi Chạy Đối Soát"
      />
    </div>
  );
};
