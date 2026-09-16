import React, { useState } from 'react';
import { 
  Trash2, 
  Wind, 
  BatteryCharging, 
  Clock, 
  RefreshCw, 
  Thermometer, 
  Droplets, 
  AlertTriangle, 
  Radio, 
  Sliders,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { BinTelemetryData } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';
import { formatDateTime, timeAgo } from '../../lib/utils';

interface BinStatusTabProps {
  telemetry: BinTelemetryData;
  deviceCode: string;
  onRefreshTelemetry: () => void;
  onUpdateFillLevel?: (newLevel: number) => void;
}

export const BinStatusTab: React.FC<BinStatusTabProps> = ({
  telemetry,
  deviceCode,
  onRefreshTelemetry,
  onUpdateFillLevel
}) => {
  const [isPinging, setIsPinging] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(telemetry.fillLevel);

  const handlePing = () => {
    setIsPinging(true);
    setTimeout(() => {
      setIsPinging(false);
      onRefreshTelemetry();
    }, 1200);
  };

  const handleLevelChange = (newVal: number) => {
    setCurrentLevel(newVal);
    if (onUpdateFillLevel) {
      onUpdateFillLevel(newVal);
    }
  };

  // Determine colors based on fillLevel
  let fillTheme = {
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-500',
    label: 'Bình thường (< 50%)'
  };

  if (currentLevel >= 80) {
    fillTheme = {
      textColor: 'text-destructive',
      bgColor: 'bg-destructive',
      label: 'Đầy khẩn cấp (≥ 80%)'
    };
  } else if (currentLevel >= 50) {
    fillTheme = {
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-500',
      label: 'Sắp đầy (50% - 79%)'
    };
  }

  return (
    <div className="space-y-6">
      {/* Header: Concise and clean */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Tình Trạng Thùng Rác IoT
            </h1>
            <span className="font-mono text-sm font-bold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              {deviceCode}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Số đo cảm biến mức đầy, khí mùi hôi và pin năng lượng mặt trời.
          </p>
        </div>

        <div className="flex items-center gap-2.5 whitespace-nowrap">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-accent"
          >
            <Sliders size={16} />
            {showSimulator ? 'Ẩn thử nghiệm' : 'Thử nghiệm số đo'}
          </button>

          <button
            onClick={handlePing}
            disabled={isPinging}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 shadow-sm"
          >
            <RefreshCw size={16} className={isPinging ? 'animate-spin' : ''} />
            {isPinging ? 'Đang cập nhật...' : 'Cập nhật tức thì'}
          </button>
        </div>
      </div>

      {/* Simulator bar */}
      {showSimulator && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-sm font-bold text-primary">
              Kéo thanh trượt để thử nghiệm phản ứng mức đầy thùng rác:
            </span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={currentLevel}
                onChange={(e) => handleLevelChange(Number(e.target.value))}
                className="w-48 accent-primary cursor-pointer"
              />
              <span className="font-mono font-black text-lg text-primary w-14 text-right">
                {currentLevel}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3 Main Highlight Cards with BIG, BOLD typography */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Fill Level */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between whitespace-nowrap">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Trash2 size={16} className="text-primary" /> Mức Đầy Dung Tích
            </span>
            <StatusBadge 
              status={currentLevel >= 80 ? 'CRITICAL_FULL' : currentLevel >= 50 ? 'WARNING_HIGH' : 'NORMAL'} 
              label={currentLevel >= 80 ? 'Đầy khẩn cấp' : currentLevel >= 50 ? 'Sắp đầy' : 'Bình thường'}
            />
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="text-5xl font-black font-mono tracking-tight text-foreground whitespace-nowrap">
                {currentLevel}<span className="text-2xl text-muted-foreground">%</span>
              </div>
              <p className="text-sm font-semibold text-muted-foreground mt-1">
                {fillTheme.label}
              </p>
            </div>

            {/* Visual Cylinder */}
            <div className="relative h-24 w-16 rounded-xl border-2 border-slate-300 bg-slate-100 overflow-hidden shadow-inner flex flex-col justify-end">
              <div 
                className={`w-full ${fillTheme.bgColor} transition-all duration-500 relative`}
                style={{ height: `${currentLevel}%` }}
              >
                <div className="absolute top-0 inset-x-0 h-1.5 bg-white/40 animate-pulse" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-slate-800 select-none">
                {currentLevel}%
              </div>
            </div>
          </div>

          {/* Progress bar line */}
          <div className="space-y-1.5">
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div 
                className={`h-full ${fillTheme.bgColor} transition-all duration-500`}
                style={{ width: `${currentLevel}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span>0%</span>
              <span>Ngưỡng gom: 75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Odor Risk */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between whitespace-nowrap">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Wind size={16} className="text-amber-600" /> Nguy Cơ Mùi Hôi
            </span>
            <StatusBadge 
              status={telemetry.odorRisk.level} 
              label={telemetry.odorRisk.level === 'SAFE' ? 'An toàn' : 'Có mùi'}
            />
          </div>

          <div>
            <div className="flex items-baseline gap-2 whitespace-nowrap">
              <span className="text-5xl font-black font-mono tracking-tight text-foreground">
                {telemetry.odorRisk.nh3Ppm}
              </span>
              <span className="text-base font-bold text-muted-foreground">ppm (Khí NH₃)</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Khí H₂S lên men: <strong className="text-foreground font-mono text-base">{telemetry.odorRisk.h2sPpm} ppm</strong>
            </p>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-medium text-amber-900 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span>Nồng độ lên men nhẹ, khuyến cáo đậy kín nắp thùng.</span>
          </div>
        </div>

        {/* Card 3: Battery & Temperature */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between whitespace-nowrap">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BatteryCharging size={16} className="text-emerald-600" /> Pin & Môi Trường
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <Sparkles size={12} /> Pin quang năng
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted-foreground font-semibold block">Dung lượng Pin</span>
              <div className="text-4xl font-black font-mono text-emerald-700 mt-1 whitespace-nowrap">
                {telemetry.batteryLevel}%
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-semibold block">Nhiệt độ thùng</span>
              <div className="text-4xl font-black font-mono text-foreground mt-1 flex items-center gap-1 whitespace-nowrap">
                <Thermometer size={22} className="text-rose-500 shrink-0" />
                {telemetry.temperatureCelsius}°C
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-medium text-muted-foreground whitespace-nowrap">
            <span className="flex items-center gap-1">
              <Droplets size={14} className="text-blue-500" /> Độ ẩm: <strong className="text-foreground">{telemetry.humidityPercent}%</strong>
            </span>
            <span>
              Mở nắp: <strong className="text-foreground font-mono text-sm">{telemetry.lidOpenCountToday} lần</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Chart & Device Metadata Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: 24h Trend Chart (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" />
              <h2 className="text-base font-bold text-card-foreground">
                Mức Rác Tích Lũy Trong Ngày (24h)
              </h2>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">Chu kỳ quét: 30 phút</span>
          </div>

          <div className="pt-2">
            <div className="h-44 flex items-end justify-between gap-4 px-4 pb-2 border-b border-border">
              {telemetry.history.map((pt, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-xs font-mono font-bold text-foreground">
                    {pt.fillLevel}%
                  </span>
                  <div 
                    className="w-full max-w-[40px] rounded-t-lg bg-primary/85 group-hover:bg-primary transition-all duration-300 relative shadow-sm"
                    style={{ height: `${(pt.fillLevel / 100) * 100}%` }}
                  />
                  <span className="text-xs font-mono font-semibold text-muted-foreground">
                    {pt.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Telemetry Gateway Stats (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Radio size={20} className="text-emerald-600" />
                <h2 className="text-base font-bold text-card-foreground">
                  Trạng Thái Cổng Thu
                </h2>
              </div>
              <StatusBadge status={telemetry.sensorStatus} label="Trực tuyến" />
            </div>

            <div className="rounded-xl bg-muted/40 p-3.5 border border-border space-y-1">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                <Clock size={14} /> Cập nhật lần cuối
              </span>
              <div className="text-lg font-extrabold text-foreground">
                {timeAgo(telemetry.lastUpdated)}
              </div>
              <div className="text-xs font-mono text-muted-foreground">
                {formatDateTime(telemetry.lastUpdated)}
              </div>
            </div>

            <div className="space-y-2 text-xs font-medium">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Giao thức:</span>
                <span className="font-bold text-foreground">LoRaWAN EU868</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Cảm biến nắp tự động:</span>
                <span className="font-bold text-emerald-700">Hoạt động tốt</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Độ chính xác siêu âm:</span>
                <span className="font-mono font-bold text-foreground">± 0.5 cm</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Tự động phát cảnh báo khi &gt; 80%</span>
            <span className="text-primary font-bold cursor-pointer hover:underline" onClick={handlePing}>
              Làm mới số đo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
