import React, { useState } from 'react';
import { 
  CreditCard, 
  QrCode, 
  Receipt, 
  CheckCircle2, 
  ShieldCheck, 
  Building, 
  Download, 
  RefreshCw, 
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { formatVND } from '../../lib/utils';
import { StatusBadge } from '../shared/StatusBadge';

interface BillingPaymentTabProps {
  householdName: string;
  householdId: string;
  userAddress: string;
}

export const BillingPaymentTab: React.FC<BillingPaymentTabProps> = ({
  householdName,
  householdId,
  userAddress
}) => {
  const [autoDebitEnabled, setAutoDebitEnabled] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Hóa Đơn Thu Phí & Trích Nợ Tự Động
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Khoản phí thu gom rác hằng tháng và thanh toán trực tuyến.
          </p>
        </div>
      </div>

      {/* Main Monthly Bill Highlight Card */}
      <div className="rounded-2xl border-2 border-primary/20 bg-card p-6 shadow-sm overflow-hidden relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                HÓA ĐƠN THÁNG 09/2026
              </span>
              <StatusBadge status="PAID" label="Đã quyết toán thành công" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black font-mono text-foreground tracking-tight">
                60.000 đ
              </span>
              <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md ring-1 ring-emerald-200">
                ✓ Đã trích nợ qua Vietcombank
              </span>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <div><strong>Chủ hộ:</strong> {householdName} • <strong>Mã HGD:</strong> {householdId}</div>
              <div><strong>Địa chỉ:</strong> {userAddress}</div>
              <div><strong>Mã giao dịch đối soát:</strong> <span className="font-mono text-primary font-bold">VCB-AUTO-8991204</span> (10/09/2026)</div>
            </div>
          </div>

          {/* Breakdown breakdown list */}
          <div className="w-full lg:w-80 rounded-xl bg-muted/40 p-4 border border-border space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Phí vệ sinh định mức:</span>
              <strong className="font-mono text-foreground">45.000 đ</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Phụ thu tràn rác cảm biến:</span>
              <strong className="font-mono text-amber-600">+10.000 đ</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Phí bảo vệ môi trường:</span>
              <strong className="font-mono text-foreground">5.000 đ</strong>
            </div>
            <div className="flex justify-between pt-1 text-sm font-black">
              <span>Tổng cộng:</span>
              <span className="font-mono text-primary">60.000 đ</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setShowQrModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            <QrCode size={16} className="text-primary" />
            <span>Mã VietQR Thanh Toán</span>
          </button>

          <button
            onClick={() => alert("Đã tải về biên lai điện tử e-Invoice định dạng PDF!")}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Download size={16} />
            <span>Tải Biên Lai Điện Tử VAT (PDF)</span>
          </button>
        </div>
      </div>

      {/* Auto-Debit Mandate Status & Control Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700 shrink-0">
              <Building size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Ủy Quyền Trích Nợ Tự Động (Auto-Debit)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ngân hàng sẽ tự động trích khoản tiền phí thu gom rác vào <strong>ngày 10 hàng tháng</strong>, không lo nợ quá hạn.
              </p>
              <div className="mt-2 text-xs text-slate-700 font-mono">
                Tài khoản liên kết: <strong>Vietcombank (007100123****)</strong> • Chủ TK: <strong>NGUYEN VAN AN</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAutoDebitEnabled(!autoDebitEnabled);
                alert(autoDebitEnabled ? 'Đã tạm hủy ủy quyền trích nợ tự động' : 'Đã kích hoạt ủy quyền trích nợ tự động!');
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                autoDebitEnabled 
                  ? 'bg-violet-50 text-violet-800 border border-violet-200' 
                  : 'bg-muted text-muted-foreground border border-border'
              }`}
            >
              {autoDebitEnabled ? <ToggleRight size={20} className="text-violet-700" /> : <ToggleLeft size={20} />}
              <span>{autoDebitEnabled ? 'Đang bật trích nợ tự động' : 'Đã tắt trích nợ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Receipt size={16} className="text-primary" />
            Lịch Sử Hóa Đơn & Biên Lai Các Kỳ
          </h3>
          <span className="text-xs text-muted-foreground font-medium">Lưu trữ minh bạch 12 tháng</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3">Mã Hóa Đơn</th>
                <th className="px-4 py-3">Kỳ Thu Phí</th>
                <th className="px-4 py-3">Số Tiền</th>
                <th className="px-4 py-3">Phương Thức</th>
                <th className="px-4 py-3">Ngày Nộp</th>
                <th className="px-4 py-3">Mã Giao Dịch</th>
                <th className="px-4 py-3">Trạng Thái</th>
                <th className="px-4 py-3 text-right">Biên Lai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono font-bold text-primary">INV-202609-001</td>
                <td className="px-4 py-3 font-bold text-foreground">Tháng 09/2026</td>
                <td className="px-4 py-3 font-mono font-black text-foreground">60.000 đ</td>
                <td className="px-4 py-3 text-violet-700 font-bold">Trích nợ tự động</td>
                <td className="px-4 py-3 text-muted-foreground">10/09/2026</td>
                <td className="px-4 py-3 font-mono text-slate-500">VCB-AUTO-8991204</td>
                <td className="px-4 py-3"><StatusBadge status="PAID" /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => alert("Đang tải biên lai...")} className="text-primary font-bold hover:underline">
                    Tải PDF
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono font-bold text-primary">INV-202608-015</td>
                <td className="px-4 py-3 font-bold text-foreground">Tháng 08/2026</td>
                <td className="px-4 py-3 font-mono font-black text-foreground">50.000 đ</td>
                <td className="px-4 py-3 text-violet-700 font-bold">Trích nợ tự động</td>
                <td className="px-4 py-3 text-muted-foreground">10/08/2026</td>
                <td className="px-4 py-3 font-mono text-slate-500">VCB-AUTO-7718290</td>
                <td className="px-4 py-3"><StatusBadge status="PAID" /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => alert("Đang tải biên lai...")} className="text-primary font-bold hover:underline">
                    Tải PDF
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono font-bold text-primary">INV-202607-009</td>
                <td className="px-4 py-3 font-bold text-foreground">Tháng 07/2026</td>
                <td className="px-4 py-3 font-mono font-black text-foreground">50.000 đ</td>
                <td className="px-4 py-3 text-blue-700 font-bold">VietQR Napas</td>
                <td className="px-4 py-3 text-muted-foreground">12/07/2026</td>
                <td className="px-4 py-3 font-mono text-slate-500">QR-MB-661298</td>
                <td className="px-4 py-3"><StatusBadge status="PAID" /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => alert("Đang tải biên lai...")} className="text-primary font-bold hover:underline">
                    Tải PDF
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* VietQR Dynamic Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl border border-border text-center space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <span className="font-bold text-foreground text-sm">VietQR Chuẩn Napas247</span>
              <button onClick={() => setShowQrModal(false)} className="text-muted-foreground hover:text-foreground font-bold">✕</button>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 inline-block shadow-sm">
              {/* Simulated VietQR SVG */}
              <svg className="w-48 h-48 mx-auto" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="#ffffff" />
                {/* QR Pattern */}
                <rect x="20" y="20" width="50" height="50" fill="#1d4ed8" />
                <rect x="30" y="30" width="30" height="30" fill="#ffffff" />
                <rect x="35" y="35" width="20" height="20" fill="#1d4ed8" />

                <rect x="130" y="20" width="50" height="50" fill="#1d4ed8" />
                <rect x="140" y="30" width="30" height="30" fill="#ffffff" />
                <rect x="145" y="35" width="20" height="20" fill="#1d4ed8" />

                <rect x="20" y="130" width="50" height="50" fill="#1d4ed8" />
                <rect x="30" y="140" width="30" height="30" fill="#ffffff" />
                <rect x="35" y="145" width="20" height="20" fill="#1d4ed8" />

                {/* Random QR data dots */}
                <rect x="80" y="30" width="10" height="20" fill="#020817" />
                <rect x="100" y="20" width="20" height="10" fill="#020817" />
                <rect x="80" y="70" width="40" height="10" fill="#020817" />
                <rect x="30" y="80" width="20" height="10" fill="#020817" />
                <rect x="70" y="90" width="60" height="20" fill="#1d4ed8" />
                <rect x="140" y="80" width="20" height="20" fill="#020817" />
                <rect x="80" y="120" width="20" height="30" fill="#020817" />
                <rect x="110" y="130" width="30" height="20" fill="#020817" />
                <rect x="150" y="120" width="30" height="40" fill="#020817" />
                <rect x="80" y="160" width="60" height="20" fill="#020817" />
              </svg>
            </div>

            <div className="text-xs space-y-1">
              <div className="font-bold text-foreground">Số tiền: 60.000 đ</div>
              <div className="text-muted-foreground font-mono">Nội dung: {householdId} THANH TOAN RAC T09</div>
              <div className="text-[11px] text-emerald-600 font-bold">Ngân hàng thụ hưởng: Vietcombank - UBND P. Hiệp Phú</div>
            </div>

            <button
              onClick={() => {
                alert("Mô phỏng: Cổng thanh toán Napas247 đã nhận tiền và gạch nợ thành công!");
                setShowQrModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
            >
              Giả Lập Quét Mã Thành Công
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
