import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Download, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertCircle, 
  Layers,
  Sparkles,
  Receipt
} from 'lucide-react';
import { Invoice, HouseholdType, InvoiceStatus } from '../../types';
import { formatVND } from '../../lib/utils';
import { StatusBadge } from '../shared/StatusBadge';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface BillingGenerationTabProps {
  invoices: Invoice[];
  onGenerateBatch: (cycle: string) => void;
}

export const BillingGenerationTab: React.FC<BillingGenerationTabProps> = ({
  invoices,
  onGenerateBatch
}) => {
  const [selectedCycle, setSelectedCycle] = useState('10/2026');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmGenerateOpen, setConfirmGenerateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    if (filterType !== 'ALL' && inv.householdType !== filterType) return false;
    if (filterStatus !== 'ALL' && inv.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        inv.householdName.toLowerCase().includes(q) ||
        inv.householdId.toLowerCase().includes(q) ||
        inv.address.toLowerCase().includes(q) ||
        inv.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Tạo & Phát Hành Hóa Đơn Định Kỳ
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Biểu phí định mức đô thị và phụ thu thể tích rác cảm biến SmartBin IoT.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setConfirmGenerateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all active:scale-95"
          >
            <Sparkles size={16} />
            <span>Lập Hóa Đơn Kỳ {selectedCycle}</span>
          </button>
          
          <button
            onClick={() => alert("Đã xuất file bảng kê hóa đơn Excel thành công!")}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-bold text-foreground shadow-sm hover:bg-muted transition-colors"
          >
            <Download size={16} />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Fee Formulation Reference Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Layers size={18} className="text-primary" />
            Biểu Phí Thu Gom Chuẩn (Quyết định UBND TP. Thủ Đức)
          </h3>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full ring-1 ring-emerald-200">
            Hiệu lực: Năm 2026
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 text-xs">
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-muted-foreground font-semibold block">Hộ gia đình sinh hoạt:</span>
            <div className="text-lg font-black font-mono text-primary mt-1">45.000 đ / tháng</div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">Tiêu chuẩn thùng rác thông minh 120L</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-muted-foreground font-semibold block">Cơ sở kinh doanh, dịch vụ:</span>
            <div className="text-lg font-black font-mono text-primary mt-1">120.000 đ / tháng</div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">Hạn mức rác sinh hoạt thương mại & quán ăn</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-muted-foreground font-semibold block">Phụ thu tràn rác (Cảm biến IoT):</span>
            <div className="text-lg font-black font-mono text-amber-700 mt-1">+10.000 đ / lần quá tải</div>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">Ghi nhận tự động từ cảm biến siêu âm SmartBin</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo tên hộ, mã HGD, địa chỉ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-input bg-card pl-9 pr-3 py-2 text-xs font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Cycle selector */}
          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="09/2026">Kỳ: Tháng 09/2026</option>
            <option value="10/2026">Kỳ: Tháng 10/2026 (Mới)</option>
          </select>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">Tất cả loại hộ</option>
            <option value="RESIDENTIAL">Hộ sinh hoạt</option>
            <option value="COMMERCIAL">Hộ kinh doanh</option>
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="UNPAID">Chưa thanh toán</option>
            <option value="OVERDUE">Quá hạn</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[960px]">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-bold">
              <tr>
                <th className="px-3 py-2.5">Mã HĐ</th>
                <th className="px-3 py-2.5">Chủ Hộ & Địa Chỉ</th>
                <th className="px-3 py-2.5">Loại Hộ / Thùng</th>
                <th className="px-3 py-2.5">Phí Cố Định</th>
                <th className="px-3 py-2.5">Phụ Thu Cảm Biến</th>
                <th className="px-3 py-2.5">Tổng Phí</th>
                <th className="px-3 py-2.5">Trạng Thái</th>
                <th className="px-3 py-2.5">Kênh Nộp</th>
                <th className="px-3 py-2.5 pr-4 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-mono font-bold text-primary whitespace-nowrap">
                    {inv.id}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-bold text-foreground">{inv.householdName}</div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-xs">{inv.address}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">{inv.householdId}</div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="font-medium text-foreground block">
                      {inv.householdType === 'RESIDENTIAL' ? 'Hộ Sinh Hoạt' : 'Hộ Kinh Doanh'}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">{inv.binId}</span>
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-foreground whitespace-nowrap">
                    {formatVND(inv.baseFee)}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-amber-600 whitespace-nowrap">
                    {inv.overloadSurcharge > 0 ? `+${formatVND(inv.overloadSurcharge)}` : '0 đ'}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-sm font-black text-foreground whitespace-nowrap">
                    {formatVND(inv.totalAmount)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {inv.paymentMethod === 'AUTO_DEBIT' && (
                      <span className="font-bold text-violet-700">Trích nợ tự động</span>
                    )}
                    {inv.paymentMethod === 'VIETQR' && (
                      <span className="font-bold text-blue-700">VietQR Napas</span>
                    )}
                    {inv.paymentMethod === 'NONE' && (
                      <span className="text-muted-foreground">Chưa thanh toán</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 pr-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/5 transition-colors"
                    >
                      Xem hóa đơn
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Receipt className="text-primary" size={24} />
                <div>
                  <h3 className="text-lg font-bold text-foreground">Hóa Đơn Thu Phí Điện Tử</h3>
                  <p className="text-xs font-mono text-muted-foreground">{selectedInvoice.id} • Kỳ {selectedInvoice.billingCycle}</p>
                </div>
              </div>
              <StatusBadge status={selectedInvoice.status} />
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-xl border border-border">
                <div>
                  <span className="text-muted-foreground">Chủ hộ:</span>
                  <div className="font-bold text-foreground text-sm">{selectedInvoice.householdName}</div>
                  <div className="font-mono text-slate-500">{selectedInvoice.phone}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Thùng rác thông minh:</span>
                  <div className="font-bold font-mono text-primary text-sm">{selectedInvoice.binId}</div>
                  <div className="text-slate-500">{selectedInvoice.householdType === 'RESIDENTIAL' ? 'Hộ gia đình' : 'Cơ sở kinh doanh'}</div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Phí vệ sinh môi trường định mức:</span>
                  <span className="font-mono font-bold text-foreground">{formatVND(selectedInvoice.baseFee)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Phụ thu tràn thể tích (Cảm biến báo):</span>
                  <span className="font-mono font-bold text-amber-600">{formatVND(selectedInvoice.overloadSurcharge)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Phí bảo vệ môi trường quy định:</span>
                  <span className="font-mono font-bold text-foreground">{formatVND(selectedInvoice.environmentalFee)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm border-t border-border font-black">
                  <span>TỔNG CỘNG THANH TOÁN:</span>
                  <span className="font-mono text-lg text-primary">{formatVND(selectedInvoice.totalAmount)}</span>
                </div>
              </div>

              {selectedInvoice.transactionRef && (
                <div className="p-3 bg-blue-50 border border-blue-200/70 rounded-xl text-blue-900 font-mono text-[11px]">
                  <strong>Mã GD Ngân Hàng:</strong> {selectedInvoice.transactionRef} (Ngày nộp: {selectedInvoice.paidDate})
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  alert(`Đã gửi hóa đơn điện tử ${selectedInvoice.id} qua Zalo cho chủ hộ!`);
                  setSelectedInvoice(null);
                }}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90"
              >
                Gửi Hóa Đơn Cho Hộ Dân
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Generation Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmGenerateOpen}
        onClose={() => setConfirmGenerateOpen(false)}
        onConfirm={() => {
          onGenerateBatch(selectedCycle);
          setConfirmGenerateOpen(false);
        }}
        title={`Xác nhận tạo hóa đơn tự động kỳ ${selectedCycle}`}
        description={`Hệ thống sẽ quét toàn bộ dữ liệu hộ dân phường Hiệp Phú, tính toán phụ thu thể tích rác từ cảm biến IoT và phát hành hóa đơn đồng loạt cho các hộ gia đình và hộ kinh doanh.`}
        confirmLabel="Lập Hóa Đơn Ngay"
      />
    </div>
  );
};
