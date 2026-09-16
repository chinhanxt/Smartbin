import React, { useState } from 'react';
import { 
  Banknote, 
  Printer, 
  CreditCard, 
  CheckCircle2, 
  HelpCircle
} from 'lucide-react';
import { EmployeeProfile, MonthlyPayroll } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';

interface MyPayslipTabProps {
  employee: EmployeeProfile;
  payrolls: MonthlyPayroll[];
}

export const MyPayslipTab: React.FC<MyPayslipTabProps> = ({ employee, payrolls }) => {
  const [selectedMonth, setSelectedMonth] = useState('09/2026');
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);

  const currentSlip = payrolls.find(p => p.employeeId === employee.id) || payrolls[0];

  const handlePrint = () => {
    window.print();
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySent(true);
    setTimeout(() => {
      setInquirySent(false);
      setShowInquiryModal(false);
    }, 1500);
  };

  if (!currentSlip) {
    return (
      <div className="p-8 text-center bg-card rounded-2xl border border-border">
        <Banknote size={32} className="mx-auto text-muted-foreground/40 mb-2" />
        <h3 className="font-bold text-base text-foreground">Chưa có dữ liệu phiếu lương</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black text-foreground tracking-tight">Phiếu lương</h2>
          <StatusBadge status={currentSlip.status} />
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs sm:text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[#004b93]"
          >
            <option value="09/2026">Tháng 09/2026</option>
            <option value="08/2026">Tháng 08/2026</option>
            <option value="07/2026">Tháng 07/2026</option>
          </select>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl border border-border bg-card text-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-muted transition flex items-center gap-1.5"
          >
            <Printer size={15} />
            In phiếu
          </button>
        </div>
      </div>

      {/* Thực Lĩnh Highlight Card */}
      <div className="rounded-2xl border border-[#004b93] bg-[#004b93] p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Thực Lĩnh Kỳ Tháng {currentSlip.month}
            </span>
            <div className="text-4xl font-black tracking-tight">
              {currentSlip.netSalary.toLocaleString('vi-VN')} <span className="text-xl font-normal text-blue-100">đ</span>
            </div>
            <div className="text-xs text-blue-100 flex items-center gap-2 pt-1">
              <CreditCard size={14} />
              <span>{currentSlip.bankName}</span>
              <span>•</span>
              <span className="font-mono font-bold">{currentSlip.bankAccount}</span>
            </div>
          </div>

          <div className="rounded-xl bg-white/10 p-3.5 border border-white/20 sm:text-right space-y-0.5">
            <span className="text-[11px] text-blue-200 font-semibold block uppercase">
              Ngày chi trả
            </span>
            <span className="text-base font-black text-white block">
              {currentSlip.payDate || '05/10/2026'}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Thông số ngày công */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm text-center">
          <div className="text-xs font-bold uppercase text-muted-foreground">Công định mức</div>
          <div className="text-2xl font-black text-foreground mt-0.5">{currentSlip.standardDays} ngày</div>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm text-center">
          <div className="text-xs font-bold uppercase text-muted-foreground">Công thực tế</div>
          <div className="text-2xl font-black text-emerald-700 mt-0.5">{currentSlip.actualDays} ngày</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm text-center">
          <div className="text-xs font-bold uppercase text-muted-foreground">Tăng ca (OT)</div>
          <div className="text-2xl font-black text-[#004b93] mt-0.5">{currentSlip.overtimeHours}h</div>
        </div>
      </div>

      {/* Chi tiết 2 cột (Thu nhập & Khấu trừ) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CỘT I: THU NHẬP */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="border-b border-border pb-2.5">
            <h3 className="font-black text-sm text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">
                +
              </span>
              Thu Nhập (Gross)
            </h3>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">Lương cơ bản</span>
              <span className="font-mono font-bold text-foreground">
                {currentSlip.baseSalary.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">Phụ cấp độc hại vệ sinh</span>
              <span className="font-mono font-bold text-emerald-700">
                +{currentSlip.hazardAllowance.toLocaleString('vi-VN')} đ
              </span>
            </div>

            {currentSlip.drivingAllowance > 0 && (
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground">Phụ cấp lái xe chuyên dụng</span>
                <span className="font-mono font-bold text-emerald-700">
                  +{currentSlip.drivingAllowance.toLocaleString('vi-VN')} đ
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">Phụ cấp ca & ăn trưa</span>
              <span className="font-mono font-bold text-emerald-700">
                +{currentSlip.shiftAllowance.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">Thưởng KPI tuyến</span>
              <span className="font-mono font-bold text-emerald-700">
                +{currentSlip.kpiBonus.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 font-black text-sm text-foreground">
              <span>Tổng thu nhập:</span>
              <span className="text-emerald-700 font-mono text-base">
                {currentSlip.totalEarnings.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>
        </div>

        {/* CỘT II: KHẤU TRỪ */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="border-b border-border pb-2.5">
            <h3 className="font-black text-sm text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-full bg-rose-100 text-rose-800 text-xs font-black flex items-center justify-center">
                -
              </span>
              Khấu Trừ
            </h3>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">BHXH & BHYT (10.5%)</span>
              <span className="font-mono font-bold text-rose-700">
                -{currentSlip.insuranceDeduction.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">Đoàn phí công đoàn</span>
              <span className="font-mono font-bold text-rose-700">
                -{currentSlip.unionFee.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">Thuế TNCN tạm tính</span>
              <span className="font-mono font-bold text-rose-700">
                -{currentSlip.taxDeduction.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 font-black text-sm text-foreground">
              <span>Tổng khấu trừ:</span>
              <span className="text-rose-700 font-mono text-base">
                -{currentSlip.totalDeductions.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nút phản hồi lương */}
      <div className="text-right">
        <button
          onClick={() => setShowInquiryModal(true)}
          className="text-xs font-bold text-[#004b93] hover:underline"
        >
          Phản hồi thắc mắc lương &gt;
        </button>
      </div>

      {/* Modal phản hồi khiếu nại lương */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-foreground">Phản hồi thắc mắc lương</h3>
            {inquirySent ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
                <div className="font-bold text-sm text-foreground">Đã gửi phản hồi thành công!</div>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-3">
                <textarea
                  rows={3}
                  placeholder="Nội dung thắc mắc về ngày công hoặc phụ cấp..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#004b93]"
                  required
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInquiryModal(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#004b93] text-white text-xs font-bold shadow hover:bg-[#003870]"
                  >
                    Gửi phản hồi
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
