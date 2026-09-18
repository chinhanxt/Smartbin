import React, { useState } from 'react';
import { 
  Banknote, 
  Download, 
  CheckCircle, 
  FileText, 
  Printer, 
  X, 
  ShieldCheck, 
  CreditCard 
} from 'lucide-react';
import { MonthlyPayroll } from '../../types';
import { formatVND } from '../../lib/utils';
import { StatusBadge } from '../shared/StatusBadge';

interface PayrollAdminTabProps {
  payroll: MonthlyPayroll[];
  onApproveAll: () => void;
}

export const PayrollAdminTab: React.FC<PayrollAdminTabProps> = ({
  payroll,
  onApproveAll
}) => {
  const [selectedPayslip, setSelectedPayslip] = useState<MonthlyPayroll | null>(null);

  const totalNet = payroll.reduce((sum, p) => sum + p.netSalary, 0);
  const totalBase = payroll.reduce((sum, p) => sum + p.baseSalary, 0);
  const totalAllowances = payroll.reduce((sum, p) => sum + p.hazardAllowance + p.drivingAllowance + p.shiftAllowance, 0);
  const totalBonuses = payroll.reduce((sum, p) => sum + p.kpiBonus, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Bảng Lương & Chế Độ Đãi Ngộ
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Kỳ 09/2026 • Phụ cấp độc hại vệ sinh & phụ cấp lái xe tải nặng.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onApproveAll}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary/90 transition-all active:scale-95"
          >
            <CheckCircle size={16} />
            <span>Duyệt Chi Lương Kỳ 09/2026</span>
          </button>

          <button
            onClick={() => alert("Đã xuất bảng lương tổng hợp định dạng Excel thành công!")}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-bold text-foreground shadow-sm hover:bg-muted transition-colors"
          >
            <Download size={16} />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Salary Formulation Reference Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tổng Lương Cơ Bản</span>
          <div className="mt-2 text-xl font-black font-mono text-foreground">
            {formatVND(totalBase)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Theo bậc lương xí nghiệp</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tổng Phụ Cấp Nghề</span>
          <div className="mt-2 text-xl font-black font-mono text-emerald-700">
            +{formatVND(totalAllowances)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Độc hại + Lái xe ép rác</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Thưởng Hoàn Thành KPI</span>
          <div className="mt-2 text-xl font-black font-mono text-amber-700">
            +{formatVND(totalBonuses)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">100% đúng giờ tuyến gom</p>
        </div>

        <div className="rounded-2xl border border-primary/30 bg-blue-50/50 p-4 shadow-sm">
          <span className="text-xs font-black text-primary uppercase tracking-wider">Tổng Thực Lĩnh Tháng 09</span>
          <div className="mt-2 text-2xl font-black font-mono text-primary">
            {formatVND(totalNet)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Chuyển khoản vào ngày 05/10</p>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="font-bold text-sm text-foreground">
            Danh Sách Chi Trả Lương & Phụ Cấp (Tháng 09/2026)
          </span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full ring-1 ring-emerald-200">
            Đã đồng bộ dữ liệu chấm công
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-bold">
              <tr>
                <th className="px-3 py-2.5">Mã Lương</th>
                <th className="px-3 py-2.5">Họ Tên & Vị Trí</th>
                <th className="px-3 py-2.5">Ngày Công</th>
                <th className="px-3 py-2.5">Lương Cơ Bản</th>
                <th className="px-3 py-2.5">PC Độc Hại</th>
                <th className="px-3 py-2.5">PC Lái Xe</th>
                <th className="px-3 py-2.5">Thưởng Tuyến</th>
                <th className="px-3 py-2.5">Giảm Trừ (BH)</th>
                <th className="px-3 py-2.5">Thực Lĩnh</th>
                <th className="px-3 py-2.5">Trạng Thái</th>
                <th className="px-3 py-2.5 pr-4 text-right">Phiếu Lương</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payroll.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-mono font-bold text-primary whitespace-nowrap">
                    {p.id}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-bold text-foreground whitespace-nowrap">{p.employeeName}</div>
                    <div className="text-[10px] text-muted-foreground">{p.positionTitle}</div>
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-700 whitespace-nowrap">
                    {p.actualDays}/{p.standardDays}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-foreground whitespace-nowrap">
                    {formatVND(p.baseSalary)}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-emerald-700 whitespace-nowrap">
                    +{formatVND(p.hazardAllowance)}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-emerald-700 whitespace-nowrap">
                    {p.drivingAllowance > 0 ? `+${formatVND(p.drivingAllowance)}` : '--'}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-amber-700 whitespace-nowrap">
                    +{formatVND(p.kpiBonus)}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-rose-600 whitespace-nowrap">
                    -{formatVND(p.totalDeductions)}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-sm font-black text-primary whitespace-nowrap">
                    {formatVND(p.netSalary)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-3 py-2.5 pr-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setSelectedPayslip(p)}
                      className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold text-primary hover:bg-muted transition-colors shadow-sm"
                    >
                      Xem phiếu
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Phiếu Lương Điện Tử Chi Tiết (Payslip Modal) */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            {/* Payslip Header */}
            <div className="border-b border-border px-6 py-4 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-primary uppercase tracking-wider">
                  Xí Nghiệp Dịch Vụ Môi Trường Đô Thị TP. Thủ Đức
                </div>
                <h3 className="text-base font-black text-foreground mt-0.5">
                  Phiếu Lương Điện Tử — Kỳ {selectedPayslip.month}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            {/* Payslip Body */}
            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="rounded-xl bg-muted/30 p-3 flex justify-between items-center">
                <div>
                  <div className="font-bold text-foreground text-sm">{selectedPayslip.employeeName}</div>
                  <div className="text-muted-foreground">{selectedPayslip.employeeId} • {selectedPayslip.positionTitle}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground">Tài khoản ngân hàng:</div>
                  <div className="font-mono font-bold text-foreground">{selectedPayslip.bankAccount}</div>
                  <div className="text-[10px] text-muted-foreground">{selectedPayslip.bankName}</div>
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="space-y-2">
                <div className="font-bold text-foreground uppercase tracking-wider text-[11px] text-emerald-800 border-b border-border pb-1">
                  1. Các Khoản Thu Nhập (Earnings)
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lương cơ bản ({selectedPayslip.actualDays}/{selectedPayslip.standardDays} ngày công):</span>
                    <span className="font-mono font-bold text-foreground">{formatVND(selectedPayslip.baseSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phụ cấp độc hại nghề vệ sinh môi trường:</span>
                    <span className="font-mono font-bold text-emerald-700">+{formatVND(selectedPayslip.hazardAllowance)}</span>
                  </div>
                  {selectedPayslip.drivingAllowance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phụ cấp vận hành xe ép rác chuyên dùng:</span>
                      <span className="font-mono font-bold text-emerald-700">+{formatVND(selectedPayslip.drivingAllowance)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phụ cấp ca làm &amp; tăng ca ({selectedPayslip.overtimeHours}h OT):</span>
                    <span className="font-mono font-bold text-foreground">+{formatVND(selectedPayslip.shiftAllowance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thưởng KPI hoàn thành khối lượng tuyến:</span>
                    <span className="font-mono font-bold text-amber-700">+{formatVND(selectedPayslip.kpiBonus)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-dashed border-border">
                    <span className="text-foreground">Tổng thu nhập trước giảm trừ:</span>
                    <span className="font-mono text-emerald-800">{formatVND(selectedPayslip.totalEarnings)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div className="space-y-2">
                <div className="font-bold text-foreground uppercase tracking-wider text-[11px] text-rose-800 border-b border-border pb-1">
                  2. Các Khoản Giảm Trừ (Deductions)
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bảo hiểm bắt buộc (BHXH, BHYT, BHTN 10.5%):</span>
                    <span className="font-mono text-rose-600">-{formatVND(selectedPayslip.insuranceDeduction)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Đoàn phí công đoàn:</span>
                    <span className="font-mono text-rose-600">-{formatVND(selectedPayslip.unionFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thuế thu nhập cá nhân (TNCN):</span>
                    <span className="font-mono text-rose-600">-{formatVND(selectedPayslip.taxDeduction)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-dashed border-border">
                    <span className="text-foreground">Tổng giảm trừ:</span>
                    <span className="font-mono text-rose-700">-{formatVND(selectedPayslip.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Total Highlight */}
              <div className="rounded-xl border-2 border-primary/20 bg-blue-50/60 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-primary uppercase">THỰC LĨNH CHUYỂN KHOẢN:</span>
                  <div className="text-[11px] text-muted-foreground">Dự kiến chi trả: {selectedPayslip.payDate}</div>
                </div>
                <div className="text-2xl font-black font-mono text-primary">
                  {formatVND(selectedPayslip.netSalary)}
                </div>
              </div>
            </div>

            {/* Payslip Footer */}
            <div className="border-t border-border px-6 py-3 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => alert("Đã gửi lệnh in phiếu lương!")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-muted"
              >
                <Printer size={14} />
                <span>In Phiếu</span>
              </button>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
