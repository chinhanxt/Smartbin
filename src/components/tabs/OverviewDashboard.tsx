import React from 'react';
import { 
  Users, 
  Trash2, 
  Calendar, 
  MessageSquareWarning, 
  ArrowUpRight, 
  Truck, 
  Wind, 
  Radio, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  BatteryCharging
} from 'lucide-react';
import { HouseholdProfile, BinTelemetryData, CollectionScheduleItem, CitizenComplaint } from '../../types';

interface OverviewDashboardProps {
  household: HouseholdProfile;
  telemetry: BinTelemetryData;
  schedules: CollectionScheduleItem[];
  complaints: CitizenComplaint[];
  onNavigateTab: (tab: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  household,
  telemetry,
  schedules,
  complaints,
  onNavigateTab
}) => {
  const activeSchedule = schedules.find((s) => s.status === 'EN_ROUTE' || s.status === 'COLLECTING') || schedules[0];
  const vehicle = activeSchedule?.assignedVehicle;
  const pendingComplaints = complaints.filter((c) => c.status !== 'RESOLVED');

  return (
    <div className="space-y-6">
      {/* Welcome Banner: Clean, high contrast, minimal text */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-card to-blue-50/50 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-xs font-bold text-primary whitespace-nowrap">
            <Sparkles size={12} />
            Hộ Dân Số Hóa
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Xin chào, {household.headOfHousehold}!
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Mã hộ: <strong className="text-foreground font-mono">{household.householdCode}</strong> • Thùng rác: <strong className="text-primary font-mono">{household.primaryBin.deviceCode}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 bg-card p-3 rounded-xl border border-border shadow-sm shrink-0 whitespace-nowrap">
          <ShieldCheck size={28} className="text-emerald-600" />
          <div>
            <div className="text-xs font-bold text-foreground">Đã Chuẩn Hóa Cư Trú</div>
            <div className="text-xs text-muted-foreground">{household.ward}</div>
          </div>
        </div>
      </div>

      {/* 4 CORE FUNCTION CARDS: Clear titles, big numbers, no awkward wrapping */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div 
          onClick={() => onNavigateTab('household')}
          className="group rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between whitespace-nowrap">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Users size={22} />
            </div>
            <ArrowUpRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground mt-0.5 whitespace-nowrap">
              Hộ Dân & Thùng Rác
            </h3>
            <p className="text-xs font-medium text-muted-foreground mt-1 truncate">
              {household.primaryBin.deviceCode} (120L)
            </p>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-bold text-primary whitespace-nowrap">
            <span>Chi tiết thiết bị</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Card 2 */}
        <div 
          onClick={() => onNavigateTab('telemetry')}
          className="group rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between whitespace-nowrap">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Trash2 size={22} />
            </div>
            <span className="font-mono text-2xl font-black text-foreground">
              {telemetry.fillLevel}%
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground mt-0.5 whitespace-nowrap">
              Tình Trạng Thùng Rác
            </h3>
            <p className="text-xs font-medium text-muted-foreground mt-1 whitespace-nowrap">
              Mùi NH₃: <strong className="text-foreground">{telemetry.odorRisk.nh3Ppm} ppm</strong> • Pin: {telemetry.batteryLevel}%
            </p>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-bold text-emerald-700 whitespace-nowrap">
            <span>Xem số đo cảm biến</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Card 3 */}
        <div 
          onClick={() => onNavigateTab('schedule')}
          className="group rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-violet-500/40 transition-all cursor-pointer flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between whitespace-nowrap">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700 group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <Truck size={22} />
            </div>
            {vehicle && (
              <span className="font-mono text-sm font-black px-2.5 py-1 rounded-lg bg-violet-100 text-violet-800">
                ~{vehicle.etaMinutes}p
              </span>
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground mt-0.5 whitespace-nowrap">
              Lịch Thu Gom & GPS
            </h3>
            <p className="text-xs font-medium text-muted-foreground mt-1 whitespace-nowrap">
              Xe {vehicle?.plateNumber} (Cách {vehicle?.distanceMeters}m)
            </p>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-bold text-violet-700 whitespace-nowrap">
            <span>Mở Radar GPS</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Card 4 */}
        <div 
          onClick={() => onNavigateTab('complaints')}
          className="group rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-amber-500/40 transition-all cursor-pointer flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between whitespace-nowrap">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <MessageSquareWarning size={22} />
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-muted text-foreground">
              {pendingComplaints.length} đang xử lý
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground mt-0.5 whitespace-nowrap">
              Gửi Phản Ánh
            </h3>
            <p className="text-xs font-medium text-muted-foreground mt-1 truncate">
              Báo bỏ sót, rơi vãi, thùng hỏng
            </p>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-bold text-amber-700 whitespace-nowrap">
            <span>Quản lý khiếu nại</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>

      {/* LIVE HIGHLIGHTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Quick Realtime Visualizer (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3 whitespace-nowrap">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Radio size={16} className="animate-pulse" />
              </div>
              <h2 className="text-base font-bold text-card-foreground">
                Giám Sát Trực Tiếp Hiện Trường
              </h2>
            </div>
            <span className="text-xs font-bold text-emerald-700">● Tín hiệu tốt</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bin visual */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 flex items-center gap-4">
              <div className="relative h-20 w-14 rounded-xl border-2 border-slate-300 bg-white overflow-hidden shadow-inner flex flex-col justify-end shrink-0">
                <div 
                  className={`w-full ${telemetry.fillLevel >= 80 ? 'bg-destructive' : telemetry.fillLevel >= 50 ? 'bg-amber-500' : 'bg-emerald-500'} transition-all duration-500`}
                  style={{ height: `${telemetry.fillLevel}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-black text-slate-800">
                  {telemetry.fillLevel}%
                </div>
              </div>

              <div className="space-y-1 min-w-0">
                <span className="text-xs font-bold text-muted-foreground uppercase">Thùng rác gia đình</span>
                <div className="font-mono text-base font-bold text-foreground truncate">
                  {household.primaryBin.deviceCode}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium whitespace-nowrap">
                  <span className="text-amber-700 flex items-center gap-1">
                    <Wind size={12} /> {telemetry.odorRisk.nh3Ppm} ppm
                  </span>
                  <span className="text-emerald-700 flex items-center gap-1">
                    <BatteryCharging size={12} /> {telemetry.batteryLevel}%
                  </span>
                </div>
              </div>
            </div>

            {/* Approaching Truck */}
            {vehicle && (
              <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 space-y-1.5">
                <div className="flex items-center justify-between whitespace-nowrap">
                  <span className="text-xs font-bold text-violet-800 uppercase flex items-center gap-1">
                    <Truck size={14} /> Xe Rác Hôm Nay
                  </span>
                  <span className="font-mono text-sm font-black text-primary">
                    ETA: ~{vehicle.etaMinutes} phút
                  </span>
                </div>
                <div className="font-mono text-lg font-black text-foreground whitespace-nowrap">
                  {vehicle.plateNumber}
                </div>
                <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Tài xế: <strong className="text-foreground">{vehicle.driverName}</strong> (Cách {vehicle.distanceMeters}m)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Schedules (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3.5 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              <h3 className="text-base font-bold text-card-foreground">
                Lịch Thu Gom Tuần
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold whitespace-nowrap">
                <span>Rác hữu cơ</span>
                <span className="font-mono">Thứ 2, 4, 6 (07:30)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-semibold whitespace-nowrap">
                <span>Rác tái chế</span>
                <span className="font-mono">Chủ nhật (14:00)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('complaints')}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 text-xs font-bold text-foreground hover:bg-accent transition-colors shadow-sm whitespace-nowrap"
          >
            <MessageSquareWarning size={14} /> Gửi Phản Ánh Dịch Vụ
          </button>
        </div>
      </div>
    </div>
  );
};
