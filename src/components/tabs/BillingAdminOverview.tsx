import React from 'react';
import { 
  FileText, 
  CreditCard, 
  Scale, 
  AlertTriangle, 
  UserX, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Building2,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { AdminTab, Invoice, AutoDebitMandate, ReconciliationBatch, DunningRecord, SuspensionCase } from '../../types';
import { formatVND } from '../../lib/utils';
import { StatusBadge } from '../shared/StatusBadge';

interface BillingAdminOverviewProps {
  invoices: Invoice[];
  mandates: AutoDebitMandate[];
  batch: ReconciliationBatch;
  dunningRecords: DunningRecord[];
  suspensionCases: SuspensionCase[];
  onNavigateTab: (tab: AdminTab) => void;
}

export const BillingAdminOverview: React.FC<BillingAdminOverviewProps> = ({
  invoices,
  mandates,
  batch,
  dunningRecords,
  suspensionCases,
  onNavigateTab
}) => {
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'OVERDUE').reduce((sum, inv) => sum + inv.totalAmount, 0);
  const collectionRate = Math.round((totalPaid / (totalInvoiced || 1)) * 100);
  const activeMandates = mandates.filter(m => m.status === 'ACTIVE').length;
  const criticalDunning = dunningRecords.filter(d => d.currentTier === 'T_PLUS_30_CRITICAL').length;
  const suspendedCount = suspensionCases.filter(s => s.status === 'SUSPENDED').length;

  return (
    <div className="space-y-6">
      {/* Header: Clear, bold typography */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span>UBND TP. THỦ ĐỨC</span>
            <span>•</span>
            <span className="text-primary font-black">PHƯỜNG HIỆP PHÚ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-0.5">
            Trung Tâm Điều Hành Thu Phí & Đối Soát Hóa Đơn
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Tổng hợp tình hình thu nộp phí dịch vụ, ủy quyền trích nợ và đối soát tài chính.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm whitespace-nowrap">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Core Banking: Trực tuyến</span>
          </div>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh thu tháng */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Doanh Thu Thu Phí</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-primary">
              <TrendingUp size={20} />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-mono text-foreground tracking-tight">
              {formatVND(totalPaid)}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Đạt tỷ lệ:</span>
              <strong className="text-emerald-600 font-bold">{collectionRate}%</strong>
              <span>(Tổng: {formatVND(totalInvoiced)})</span>
            </div>
          </div>
        </div>

        {/* Trích nợ tự động */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ủy Quyền Trích Nợ</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <CreditCard size={20} />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-mono text-foreground tracking-tight">
              {activeMandates} / {mandates.length}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-bold text-violet-700">68%</span>
              <span>hộ dân tự động thanh toán qua thẻ/ví</span>
            </div>
          </div>
        </div>

        {/* Cảnh báo nợ quá hạn */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nợ Vượt Ngưỡng 30 Ngày</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle size={20} />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-mono text-rose-600 tracking-tight">
              {criticalDunning} hồ sơ
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Tổng nợ tồn đọng: <strong className="text-rose-600 font-mono font-bold">{formatVND(totalOverdue)}</strong>
            </div>
          </div>
        </div>

        {/* Tạm ngừng dịch vụ */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Đang Tạm Ngừng Gom</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <UserX size={20} />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-mono text-foreground tracking-tight">
              {suspendedCount} điểm gom
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Đã đồng bộ blacklist sang xe rác GPS
            </div>
          </div>
        </div>
      </div>

      {/* 5 Core Functions Quick Action Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground">
            Danh Mục Nghiệp Vụ Thu Phí
          </h2>
          <span className="text-xs text-muted-foreground font-medium">Hệ thống phân quyền & đối soát</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Card CN 8 */}
          <div 
            onClick={() => onNavigateTab('BILLING_GEN')}
            className="group rounded-xl border border-border bg-card p-4 shadow-2xs hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-primary border border-blue-200">
                  Kỳ 09/2026
                </span>
                <span className="text-[11px] text-muted-foreground">Biểu phí UBND</span>
              </div>
              <h3 className="text-sm font-bold text-foreground mt-2 group-hover:text-primary transition-colors">
                Tạo Hóa Đơn Định Kỳ
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Lập phí định mức hộ dân và phụ thu thể tích SmartBin.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs font-bold text-primary">
              <span>Hóa đơn</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Card CN 9 */}
          <div 
            onClick={() => onNavigateTab('AUTO_DEBIT')}
            className="group rounded-xl border border-border bg-card p-4 shadow-2xs hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-700 border border-violet-200">
                  Auto-Debit
                </span>
                <span className="text-[11px] font-bold text-emerald-700">NAPAS</span>
              </div>
              <h3 className="text-sm font-bold text-foreground mt-2 group-hover:text-primary transition-colors">
                Trích Nợ Tự Động & Kênh Thu
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Ủy quyền ngân hàng định kỳ và ví điện tử hàng tháng.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs font-bold text-primary">
              <span>Ủy quyền trích nợ</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Card CN 10 */}
          <div 
            onClick={() => onNavigateTab('RECONCILIATION')}
            className="group rounded-xl border border-border bg-card p-4 shadow-2xs hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  Đối Soát 3 Chiều
                </span>
                <span className="text-[11px] font-bold text-purple-700">Khớp 100%</span>
              </div>
              <h3 className="text-sm font-bold text-foreground mt-2 group-hover:text-primary transition-colors">
                Xác Nhận & Đối Soát Thanh Toán
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Khớp Hóa đơn, Sao kê ngân hàng và Cổng thanh toán.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs font-bold text-primary">
              <span>Đối soát ngân hàng</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Card CN 11 */}
          <div 
            onClick={() => onNavigateTab('DUNNING')}
            className="group rounded-xl border border-border bg-card p-4 shadow-2xs hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                  Nhắc Phí Đa Kênh
                </span>
                <span className="text-[11px] font-bold text-rose-600">4 Mốc nhắc</span>
              </div>
              <h3 className="text-sm font-bold text-foreground mt-2 group-hover:text-primary transition-colors">
                Nhắc Phí & Cảnh Báo Quá Hạn
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Gửi Zalo ZNS / SMS tại các mốc T-3, T-0, T+5, T+15.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs font-bold text-primary">
              <span>Sổ theo dõi nhắc nợ</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Card CN 12 */}
          <div 
            onClick={() => onNavigateTab('SUSPENSION')}
            className="group rounded-xl border border-border bg-card p-4 shadow-2xs hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                  Chế Tài Phường
                </span>
                <span className="text-[11px] font-bold text-blue-700">GPS Sync</span>
              </div>
              <h3 className="text-sm font-bold text-foreground mt-2 group-hover:text-primary transition-colors">
                Tạm Ngừng & Khôi Phục Dịch Vụ
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Tạm ngừng thu gom quá hạn và đồng bộ sang GPS xe rác.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs font-bold text-primary">
              <span>Tạm ngừng dịch vụ</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Card Trạng Thái Kết Nối IoT */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                Hạ Tầng Tích Hợp
              </span>
              <h3 className="text-sm font-bold text-foreground mt-2">
                Đồng Bộ Đa Hệ Thống
              </h3>
              <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Traccar GPS:</span>
                  <strong className="text-emerald-600 font-bold">Đã đồng bộ</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>VietQR / Napas:</span>
                  <strong className="text-emerald-600 font-bold">Sẵn sàng</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>SmartBin LoRa:</span>
                  <strong className="text-emerald-600 font-bold">Online (120)</strong>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-border text-[11px] text-muted-foreground">
              Microservice v1.2.0 • P. Hiệp Phú
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
