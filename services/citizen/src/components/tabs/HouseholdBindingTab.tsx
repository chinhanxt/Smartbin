import React, { useState } from 'react';
import { 
  Users, 
  Trash2, 
  QrCode, 
  Link2, 
  MapPin, 
  Phone, 
  IdCard, 
  Calendar, 
  CheckCircle2, 
  RefreshCw, 
  Cpu, 
  Radio, 
  ShieldCheck,
  Download,
  AlertCircle
} from 'lucide-react';
import { HouseholdProfile } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';

interface HouseholdBindingTabProps {
  household: HouseholdProfile;
  onUpdateHousehold: (updated: HouseholdProfile) => void;
}

export const HouseholdBindingTab: React.FC<HouseholdBindingTabProps> = ({
  household,
  onUpdateHousehold
}) => {
  const [showBindModal, setShowBindModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [newDeviceCode, setNewDeviceCode] = useState('');
  const [newDevEui, setNewDevEui] = useState('');
  const [bindSuccessMsg, setBindSuccessMsg] = useState<string | null>(null);

  const handleBindDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceCode.trim()) return;

    const updated: HouseholdProfile = {
      ...household,
      primaryBin: {
        ...household.primaryBin,
        deviceCode: newDeviceCode.trim().toUpperCase(),
        loraDevEui: newDevEui.trim() || household.primaryBin.loraDevEui,
        status: 'PAIRED',
        installDate: new Intl.DateTimeFormat('vi-VN').format(new Date())
      }
    };

    onUpdateHousehold(updated);
    setShowBindModal(false);
    setNewDeviceCode('');
    setNewDevEui('');
    setBindSuccessMsg(`Đã liên kết thiết bị ${updated.primaryBin.deviceCode} thành công!`);
    setTimeout(() => setBindSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header: Concise and clean */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Hộ Gia Đình & Thùng Rác Riêng
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Thông tin định danh cư trú và thiết bị cảm biến rác thông minh của hộ.
          </p>
        </div>

        <div className="flex items-center gap-2.5 whitespace-nowrap">
          <button
            onClick={() => setShowQrModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-accent"
          >
            <QrCode size={16} />
            Mã QR Dán Thùng
          </button>
          <button
            onClick={() => setShowBindModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 shadow-sm"
          >
            <Link2 size={16} />
            Gắn Thùng Mới
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {bindSuccessMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{bindSuccessMsg}</span>
        </div>
      )}

      {/* Main Cards: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Household Info (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-4 whitespace-nowrap">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-card-foreground">
                  Hồ Sơ Hộ Dân
                </h2>
                <span className="text-xs text-muted-foreground">CSDL Dân cư số</span>
              </div>
            </div>
            <StatusBadge status={household.status} label="Đang hoạt động" />
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Mã Hộ Gia Đình
              </span>
              <div className="mt-1 flex items-center justify-between font-mono text-xl font-black text-foreground bg-muted/40 p-3 rounded-xl border border-border whitespace-nowrap">
                <span>{household.householdCode}</span>
                <span className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary font-sans font-bold">
                  {household.memberCount} nhân khẩu
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-background border border-border">
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                  <Users size={13} /> Chủ hộ
                </span>
                <p className="text-base font-bold text-foreground mt-1 truncate">
                  {household.headOfHousehold}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border">
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                  <IdCard size={13} /> Số CCCD
                </span>
                <p className="text-base font-mono font-bold text-foreground mt-1 truncate">
                  {household.idCardNumber}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-background border border-border">
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                  <Phone size={13} /> Điện thoại
                </span>
                <p className="text-base font-bold text-foreground mt-1 truncate">
                  {household.phone}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border">
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                  <Calendar size={13} /> Ngày hòa mạng
                </span>
                <p className="text-sm font-semibold text-foreground mt-1 truncate">
                  {household.registeredDate}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-background border border-border">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <MapPin size={13} /> Địa chỉ thu gom đã xác thực
              </span>
              <p className="font-semibold text-foreground mt-1 text-sm leading-relaxed">
                {household.fullAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Linked Smart Bin (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-4 whitespace-nowrap">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Trash2 size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-card-foreground">
                  Thùng Rác Thông Minh Riêng
                </h2>
                <span className="text-xs text-muted-foreground">Thiết bị cảm biến IoT tại nhà</span>
              </div>
            </div>
            <StatusBadge status={household.primaryBin.status} label="Đã liên kết" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Device ID Card */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-1">
              <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Cpu size={14} className="text-primary" /> Mã Thiết Bị
              </span>
              <div className="text-2xl font-black font-mono text-primary whitespace-nowrap">
                {household.primaryBin.deviceCode}
              </div>
              <p className="text-xs font-medium text-muted-foreground truncate">
                Model: <strong className="text-foreground">{household.primaryBin.model}</strong>
              </p>
            </div>

            {/* Capacity Card */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-1">
              <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Trash2 size={14} className="text-emerald-600" /> Dung Tích Thùng
              </span>
              <div className="text-2xl font-black text-foreground whitespace-nowrap">
                {household.primaryBin.capacityLiters} Lít
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                Lắp đặt ngày: {household.primaryBin.installDate}
              </p>
            </div>
          </div>

          {/* Telemetry Hardware Specs Grid */}
          <div className="rounded-xl border border-border bg-background p-4 space-y-2.5">
            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
              <Radio size={14} className="text-primary" /> Thông Số Truyền Tin
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground block font-medium">Thẻ RFID nhận diện:</span>
                <span className="font-mono font-bold text-foreground truncate block text-sm mt-0.5">
                  {household.primaryBin.rfidTag}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground block font-medium">LoRaWAN DevEUI:</span>
                <span className="font-mono font-bold text-foreground truncate block text-sm mt-0.5">
                  {household.primaryBin.loraDevEui}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground block font-medium">Địa chỉ MAC:</span>
                <span className="font-mono font-bold text-foreground block text-sm mt-0.5">
                  {household.primaryBin.macAddress}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-card border border-border">
                <span className="text-muted-foreground block font-medium">Phiên bản Firmware:</span>
                <span className="font-mono font-bold text-foreground block text-sm mt-0.5">
                  {household.primaryBin.firmwareVersion}
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-between gap-3 whitespace-nowrap">
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <ShieldCheck size={16} />
              Dữ liệu cảm biến được mã hóa bảo mật
            </span>

            <button
              onClick={() => setShowBindModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-bold text-foreground hover:bg-accent transition-colors"
            >
              <RefreshCw size={13} /> Thay Đổi Mã Thùng
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: BIND NEW DEVICE */}
      {showBindModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setShowBindModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Link2 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-card-foreground">
                  Gắn Thùng Rác Thông Minh Mới
                </h3>
                <p className="text-xs text-muted-foreground">
                  Nhập mã định danh trên nắp thùng được cấp
                </p>
              </div>
            </div>

            <form onSubmit={handleBindDevice} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Mã Thiết Bị (Device Code) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: BIN-IOT-9901"
                  value={newDeviceCode}
                  onChange={(e) => setNewDeviceCode(e.target.value)}
                  className="form-input font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Mã LoRaWAN DevEUI (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: A840410001889955"
                  value={newDevEui}
                  onChange={(e) => setNewDevEui(e.target.value)}
                  className="form-input font-mono"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBindModal(false)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground hover:bg-accent"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-sm"
                >
                  Xác Nhận Ghép Nối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QR CODE */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setShowQrModal(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="p-4 rounded-2xl bg-white border border-primary/20 shadow-inner inline-block">
              <svg className="h-44 w-44 mx-auto" viewBox="0 0 100 100" fill="none">
                <rect width="100" height="100" fill="white" />
                <path d="M10 10h24v24h-24z M14 14h16v16h-16z M18 18h8v8h-8z" fill="#004b93" />
                <path d="M66 10h24v24h-24z M70 14h16v16h-16z M74 18h8v8h-8z" fill="#004b93" />
                <path d="M10 66h24v24h-24z M14 70h16v16h-16z M18 74h8v8h-8z" fill="#004b93" />
                <rect x="42" y="12" width="6" height="20" fill="#1d4ed8" />
                <rect x="52" y="16" width="8" height="6" fill="#1d4ed8" />
                <rect x="42" y="42" width="16" height="16" fill="#004b93" rx="2" />
                <rect x="12" y="42" width="18" height="8" fill="#1d4ed8" />
                <rect x="70" y="42" width="18" height="8" fill="#1d4ed8" />
                <rect x="42" y="70" width="10" height="18" fill="#1d4ed8" />
                <rect x="62" y="66" width="26" height="22" fill="#004b93" />
              </svg>
            </div>

            <div>
              <div className="text-xl font-black font-mono text-primary">
                {household.primaryBin.deviceCode}
              </div>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {household.headOfHousehold} — {household.householdCode}
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={() => setShowQrModal(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground hover:bg-accent"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  alert('Đã gửi lệnh in thẻ dán thùng!');
                  setShowQrModal(false);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                <Download size={16} /> Tải Thẻ In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
