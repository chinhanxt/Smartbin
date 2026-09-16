import React, { useState } from 'react';
import { 
  CreditCard, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Building, 
  Smartphone, 
  Plus, 
  RefreshCw,
  Search,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { AutoDebitMandate, MandateStatus } from '../../types';
import { formatVND } from '../../lib/utils';
import { StatusBadge } from '../shared/StatusBadge';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface AutoDebitManagementTabProps {
  mandates: AutoDebitMandate[];
  onTriggerBatchDebit: () => void;
  onAddMandate: (mandate: Omit<AutoDebitMandate, 'id'>) => void;
}

export const AutoDebitManagementTab: React.FC<AutoDebitManagementTabProps> = ({
  mandates,
  onTriggerBatchDebit,
  onAddMandate
}) => {
  const [confirmDebitOpen, setConfirmDebitOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBank, setFilterBank] = useState('ALL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New mandate form state
  const [newHouseholdId, setNewHouseholdId] = useState('');
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newBank, setNewBank] = useState('Vietcombank');
  const [newAccountNum, setNewAccountNum] = useState('');
  const [newHolder, setNewHolder] = useState('');

  const filteredMandates = mandates.filter(m => {
    if (filterBank !== 'ALL' && !m.bankName.includes(filterBank)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.householdName.toLowerCase().includes(q) ||
        m.householdId.toLowerCase().includes(q) ||
        m.accountHolder.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExecuteBatch = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onTriggerBatchDebit();
      setIsProcessing(false);
      alert('Đã gửi lệnh trích nợ tự động đến Cổng thanh toán liên ngân hàng NAPAS & Vietcombank!');
    }, 800);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHouseholdName || !newAccountNum) {
      alert('Vui lòng điền đầy đủ thông tin ủy quyền');
      return;
    }
    onAddMandate({
      householdId: newHouseholdId || `HGD-TPTD-${Math.floor(10000 + Math.random() * 90000)}`,
      householdName: newHouseholdName,
      phone: newPhone || '0909 888 777',
      address: newAddress || 'Phường Hiệp Phú, TP. Thủ Đức',
      bankName: newBank,
      bankAccountNumber: newAccountNum,
      accountHolder: newHolder || newHouseholdName.toUpperCase(),
      mandateDate: '17/09/2026',
      status: 'ACTIVE',
      autoDebitDay: 10,
    });
    setCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Thanh Toán & Đăng Ký Trích Tiền Tự Động
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Quản lý kênh thanh toán trực tuyến (VietQR, VNPAY, MoMo) và ủy quyền trích nợ tự động (Auto-Debit).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-bold text-foreground shadow-sm hover:bg-muted transition-colors"
          >
            <Plus size={16} className="text-primary" />
            <span>Đăng Ký Ủy Quyền Mới</span>
          </button>

          <button
            onClick={() => setConfirmDebitOpen(true)}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-violet-800 transition-all active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
            <span>Phát Lệnh Trích Nợ Định Kỳ</span>
          </button>
        </div>
      </div>

      {/* Online Gateway Channels Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Kênh Trích Nợ Ngân Hàng</span>
            <Building size={18} className="text-primary" />
          </div>
          <div className="mt-2 text-xl font-black text-foreground">
            NAPAS & Core Banking
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Hỗ trợ Vietcombank, BIDV, MB, Agribank... trích nợ ngày 10 hằng tháng.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Cổng Thanh Toán Tức Thì</span>
            <CreditCard size={18} className="text-blue-600" />
          </div>
          <div className="mt-2 text-xl font-black text-foreground">
            VietQR Pro & VNPAY
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Quét mã QR động nhận diện tức thì mã hộ gia đình, tự động gạch nợ sau 3 giây.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Ví Điện Tử Liên Kết</span>
            <Smartphone size={18} className="text-pink-600" />
          </div>
          <div className="mt-2 text-xl font-black text-foreground">
            MoMo / ZaloPay
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Người dân liên kết ví thanh toán tự động hoặc nhận thông báo nộp tiền qua Mini App.
          </p>
        </div>
      </div>

      {/* Mandates Management Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm theo chủ tài khoản, mã hộ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-input bg-card pl-9 pr-3 py-2 text-xs font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
              className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">Mọi ngân hàng / ví</option>
              <option value="Vietcombank">Vietcombank</option>
              <option value="BIDV">BIDV</option>
              <option value="MB Bank">MB Bank</option>
              <option value="MoMo">Ví MoMo</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[960px]">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-bold">
              <tr>
                <th className="px-3 py-2.5">Mã Ủy Quyền</th>
                <th className="px-3 py-2.5">Hộ Dân & Mã Cư Trú</th>
                <th className="px-3 py-2.5">Ngân Hàng / Ví</th>
                <th className="px-3 py-2.5">Số Tài Khoản Ủy Quyền</th>
                <th className="px-3 py-2.5">Chủ Tài Khoản</th>
                <th className="px-3 py-2.5">Ngày Thu Định Kỳ</th>
                <th className="px-3 py-2.5">Trạng Thái Ủy Quyền</th>
                <th className="px-3 py-2.5 pr-4 text-right">Kết Quả Kỳ Trước</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMandates.map((m) => (
                <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-mono font-bold text-violet-700 whitespace-nowrap">
                    {m.id}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-bold text-foreground">{m.householdName}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">{m.householdId}</div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="font-bold text-foreground">{m.bankName}</span>
                  </td>
                  <td className="px-3 py-2.5 font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {m.bankAccountNumber}
                  </td>
                  <td className="px-3 py-2.5 font-bold uppercase text-slate-800 whitespace-nowrap">
                    {m.accountHolder}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-medium text-muted-foreground">
                    Ngày {m.autoDebitDay} hàng tháng
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <StatusBadge status={m.status} label={m.status === 'ACTIVE' ? 'Đang hiệu lực' : m.status === 'FAILED' ? 'Lỗi trừ tiền' : 'Chờ xác nhận'} />
                  </td>
                  <td className="px-3 py-2.5 pr-4 text-right whitespace-nowrap">
                    {m.lastDebitStatus === 'SUCCESS' && (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <CheckCircle size={14} /> Đã thu {formatVND(m.lastAmount || 0)}
                      </span>
                    )}
                    {m.lastDebitStatus === 'INSUFFICIENT_FUNDS' && (
                      <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                        <AlertCircle size={14} /> Không đủ số dư
                      </span>
                    )}
                    {!m.lastDebitStatus && (
                      <span className="text-muted-foreground">Chưa có giao dịch</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Đăng Ký Ủy Quyền Mới */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-foreground">Đăng Ký Ủy Quyền Trích Nợ Định Kỳ</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Thiết lập liên kết tài khoản ngân hàng để tự động thu gom phí rác hàng tháng theo ủy nhiệm chi.
            </p>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Tên Hộ Dân / Chủ Thùng Rác:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lê Thị Ngọc"
                  value={newHouseholdName}
                  onChange={(e) => setNewHouseholdName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card p-2.5 font-medium focus:ring-2 focus:ring-ring focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Ngân Hàng / Ví Điện Tử Ủy Quyền:</label>
                <select
                  value={newBank}
                  onChange={(e) => setNewBank(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card p-2.5 font-bold focus:ring-2 focus:ring-ring focus:outline-none"
                >
                  <option value="Vietcombank">Vietcombank (VCB Digibank)</option>
                  <option value="BIDV">BIDV (SmartBanking)</option>
                  <option value="MB Bank">MB Bank</option>
                  <option value="VietinBank">VietinBank iPay</option>
                  <option value="Ví MoMo">Ví Điện Tử MoMo</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Số Tài Khoản / Số Ví:</label>
                <input
                  type="text"
                  required
                  placeholder="Số tài khoản ngân hàng"
                  value={newAccountNum}
                  onChange={(e) => setNewAccountNum(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card p-2.5 font-mono font-bold focus:ring-2 focus:ring-ring focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Tên Chủ Tài Khoản (In hoa không dấu):</label>
                <input
                  type="text"
                  placeholder="LE THI NGOC"
                  value={newHolder}
                  onChange={(e) => setNewHolder(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card p-2.5 uppercase font-bold focus:ring-2 focus:ring-ring focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-700 px-4 py-2 text-xs font-bold text-white hover:bg-violet-800 shadow-md"
                >
                  Xác Nhận Lưu Ủy Quyền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Batch Debit */}
      <ConfirmDialog
        isOpen={confirmDebitOpen}
        onClose={() => setConfirmDebitOpen(false)}
        onConfirm={handleExecuteBatch}
        title="Phát lệnh trích nợ tự động định kỳ"
        description={`Hệ thống sẽ gửi gói yêu cầu trích nợ tự động cho toàn bộ ${mandates.filter(m => m.status === 'ACTIVE').length} hộ dân đã ủy quyền qua Cổng thanh toán liên ngân hàng NAPAS & Vietcombank. Tiền sẽ được đối soát tự động.`}
        confirmLabel="Khởi Chạy Trích Nợ"
      />
    </div>
  );
};
