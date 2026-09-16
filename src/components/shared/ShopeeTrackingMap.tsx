import React, { useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Minus, 
  LocateFixed, 
  Navigation
} from 'lucide-react';

interface ShopeeTrackingMapProps {
  plateNumber: string;
  driverName: string;
  etaMinutes: number;
  distanceMeters: number;
  speedKmH: number;
  homeAddress?: string;
  className?: string;
}

export const ShopeeTrackingMap: React.FC<ShopeeTrackingMapProps> = ({
  plateNumber,
  driverName,
  etaMinutes,
  distanceMeters,
  speedKmH,
  homeAddress = 'Số 48/12 Đường Số 8, P. Hiệp Phú',
  className = ''
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  // Xe rác ở đầu tuyến trên Đường Lê Văn Việt (500, 70)
  const currentPos = { x: 500, y: 70, angle: 180 };

  return (
    <div className={`relative h-80 sm:h-96 w-full rounded-2xl border-2 border-slate-200 bg-[#e8ecf1] overflow-hidden select-none shadow-sm ${className}`}>
      {/* REALISTIC SHOPEE-STYLE LIGHT STREET MAP SVG */}
      <svg 
        className="absolute inset-0 h-full w-full transition-transform duration-300"
        viewBox="0 0 600 360" 
        preserveAspectRatio="xMidYMid meet"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <defs>
          <filter id="shopee-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#334155" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* 1. Base Ground (Clean municipal light grey) */}
        <rect width="600" height="360" fill="#e8ecf1" />

        {/* 2. City Blocks (White & pastel building zones) */}
        {/* Top Blocks (y: 12 - 50) */}
        <rect x="20" y="12" width="370" height="38" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
        <text x="205" y="34" fontSize="9" fontWeight="700" fill="#94a3b8" textAnchor="middle">
          KHU DÂN CƯ PHƯỜNG HIỆP PHÚ
        </text>

        <rect x="440" y="12" width="140" height="38" rx="6" fill="#fdfbf7" stroke="#cbd5e1" strokeWidth="1" />
        <text x="510" y="34" fontSize="9" fontWeight="800" fill="#64748b" textAnchor="middle">
          VINCOM PLAZA
        </text>

        {/* Center Blocks (y: 92 - 188) */}
        {/* Công Viên Cây Xanh */}
        <rect x="180" y="92" width="90" height="96" rx="8" fill="#dcfce7" stroke="#bbf7d0" strokeWidth="1.5" />
        <g opacity="0.75">
          <circle cx="210" cy="130" r="11" fill="#86efac" />
          <circle cx="245" cy="140" r="13" fill="#86efac" />
          <circle cx="220" cy="160" r="9" fill="#4ade80" />
        </g>
        <text x="225" y="114" fontSize="8.5" fontWeight="800" fill="#15803d" textAnchor="middle">
          Công Viên Hiệp Phú
        </text>

        {/* Trường Học */}
        <rect x="290" y="92" width="110" height="96" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
        <text x="345" y="144" fontSize="8.5" fontWeight="700" fill="#64748b" textAnchor="middle">
          Trường THPT Hiệp Phú
        </text>

        {/* Chợ & Thương mại */}
        <rect x="440" y="92" width="140" height="96" rx="6" fill="#fdfbf7" stroke="#cbd5e1" strokeWidth="1" />
        <text x="510" y="144" fontSize="8.5" fontWeight="700" fill="#64748b" textAnchor="middle">
          Chợ Tăng Nhơn Phú B
        </text>

        {/* Bottom Blocks (y: 232 - 346) */}
        <rect x="20" y="232" width="120" height="114" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
        <text x="80" y="295" fontSize="8.5" fontWeight="700" fill="#94a3b8" textAnchor="middle">
          Tổ Dân Phố 2
        </text>

        <rect x="180" y="232" width="90" height="114" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
        <text x="225" y="295" fontSize="8" fontWeight="700" fill="#94a3b8" textAnchor="middle">
          Khu Nhà Liền Kề
        </text>

        <rect x="290" y="232" width="110" height="114" rx="6" fill="#fdfbf7" stroke="#cbd5e1" strokeWidth="1" />
        <text x="345" y="295" fontSize="8.5" fontWeight="700" fill="#94a3b8" textAnchor="middle">
          Khu Phố 3
        </text>

        <rect x="440" y="232" width="140" height="114" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
        <text x="510" y="295" fontSize="8.5" fontWeight="700" fill="#94a3b8" textAnchor="middle">
          Trạm Y Tế Phường
        </text>

        {/* 3. ROADS & STREET NETWORK (Exact alignment with route!) */}

        {/* Đường Lê Văn Việt (Horizontal Avenue at y=70) */}
        <path d="M 0 70 L 600 70" stroke="#cbd5e1" strokeWidth="28" strokeLinecap="square" />
        <path d="M 0 70 L 600 70" stroke="#ffffff" strokeWidth="24" strokeLinecap="square" />
        {/* Yellow center line */}
        <path d="M 0 70 L 600 70" stroke="#fde047" strokeWidth="2" strokeDasharray="10 8" />
        <text x="210" y="73" fontSize="8" fontWeight="800" fill="#64748b" letterSpacing="1">
          ĐƯỜNG LÊ VĂN VIỆT
        </text>

        {/* Đường Đình Phong Phú (Vertical at x=280) */}
        <path d="M 280 56 L 280 360" stroke="#cbd5e1" strokeWidth="18" />
        <path d="M 280 56 L 280 360" stroke="#ffffff" strokeWidth="14" />

        {/* Đường Số 8 (Vertical at x=420) */}
        <path d="M 420 56 L 420 360" stroke="#cbd5e1" strokeWidth="24" />
        <path d="M 420 56 L 420 360" stroke="#ffffff" strokeWidth="20" />
        <text x="424" y="148" fontSize="8" fontWeight="800" fill="#475569" transform="rotate(90 424 148)" letterSpacing="0.8">
          ĐƯỜNG SỐ 8
        </text>

        {/* Đường Số 10 (Horizontal connecting at y=210) */}
        <path d="M 0 210 L 600 210" stroke="#cbd5e1" strokeWidth="24" />
        <path d="M 0 210 L 600 210" stroke="#ffffff" strokeWidth="20" />
        <text x="250" y="213" fontSize="7.5" fontWeight="800" fill="#64748b" letterSpacing="0.8">
          ĐƯỜNG SỐ 10 (NỐI DÀI)
        </text>

        {/* Hẻm 48 (Vertical at x=160) */}
        <path d="M 160 198 L 160 360" stroke="#cbd5e1" strokeWidth="22" />
        <path d="M 160 198 L 160 360" stroke="#ffffff" strokeWidth="18" />
        <text x="164" y="260" fontSize="7.5" fontWeight="800" fill="#475569" transform="rotate(90 164 260)" letterSpacing="0.5">
          HẺM 48
        </text>

        {/* 4. ACTIVE DELIVERY ROUTE (100% aligned along the exact road centers!) */}
        {/* Glow casing */}
        <path 
          d="M 500 70 L 420 70 L 420 210 L 160 210 L 160 285" 
          fill="none" 
          stroke="#93c5fd" 
          strokeWidth="11" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          opacity="0.8"
        />
        {/* Solid active route line */}
        <path 
          d="M 500 70 L 420 70 L 420 210 L 160 210 L 160 285" 
          fill="none" 
          stroke="#2563eb" 
          strokeWidth="5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        {/* Directional white dash */}
        <path 
          d="M 500 70 L 420 70 L 420 210 L 160 210 L 160 285" 
          fill="none" 
          stroke="#ffffff" 
          strokeWidth="2.2" 
          strokeDasharray="6 8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />

        {/* 5. DESTINATION PIN (Nhà Bạn tại x=160, y=285) */}
        <circle cx="160" cy="285" r="16" fill="#f43f5e" opacity="0.25">
          <animate attributeName="r" values="10;22;10" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0.05;0.35" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="160" cy="285" r="4" fill="#e11d48" />

        {/* Shopee red pin marker */}
        <g transform="translate(146, 248)" filter="url(#shopee-shadow)">
          <path 
            d="M 14 0 C 6.5 0 0.5 6 0.5 13.5 C 0.5 23.5 14 36 14 36 C 14 36 27.5 23.5 27.5 13.5 C 27.5 6 21.5 0 14 0 Z" 
            fill="#e11d48" 
            stroke="#ffffff" 
            strokeWidth="2" 
          />
          <circle cx="14" cy="13" r="5" fill="#ffffff" />
          <path d="M 11 14 L 14 11.5 L 17 14 V 16 H 11 Z" fill="#e11d48" />
        </g>

        {/* Destination Tag (Below the pin) */}
        <g transform="translate(160, 312)">
          <rect x="-70" y="0" width="140" height="18" rx="4" fill="#ffffff" stroke="#f43f5e" strokeWidth="1.2" filter="url(#shopee-shadow)" />
          <text x="0" y="12" fontSize="8" fontWeight="800" fill="#9f1239" textAnchor="middle">
            Vị trí nhà bạn (Thùng rác)
          </text>
        </g>

        {/* 6. LIVE VEHICLE TRUCK (Rendered directly in SVG at currentPos) */}
        <g transform={`translate(${currentPos.x}, ${currentPos.y})`} filter="url(#shopee-shadow)">
          {/* Radial ping ripple */}
          <circle cx="0" cy="0" r="16" fill="#3b82f6" opacity="0.3">
            <animate attributeName="r" values="10;24;10" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.45;0.05;0.45" dur="1.8s" repeatCount="indefinite" />
          </circle>

          {/* Truck Circle Pin */}
          <circle cx="0" cy="0" r="14" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
          
          {/* Truck Icon */}
          <g transform="translate(-8, -8) scale(0.65)">
            <path 
              d="M 5 17 L 3 17 A 2 2 0 0 1 1 15 L 1 6 A 2 2 0 0 1 3 4 L 15 4 A 2 2 0 0 1 17 6 L 17 10 M 17 10 L 21 10 A 2 2 0 0 1 23 12 L 23 15 A 2 2 0 0 1 21 17 L 19 17 M 17 10 L 17 17 M 7 19 A 2 2 0 1 0 7 15 A 2 2 0 0 0 7 19 Z M 17 19 A 2 2 0 1 0 17 15 A 2 2 0 0 0 17 19 Z" 
              fill="none" 
              stroke="#ffffff" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </g>

          {/* Floating Tooltip Callout above the truck */}
          <g transform="translate(0, -22)">
            <rect x="-56" y="-18" width="112" height="20" rx="5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <polygon points="-4,2 4,2 0,6" fill="#0f172a" />
            <circle cx="-44" cy="-8" r="3" fill="#34d399" />
            <text x="-36" y="-5" fontSize="8.5" fontWeight="800" fill="#34d399" fontFamily="monospace">
              {plateNumber}
            </text>
            <text x="18" y="-5" fontSize="8" fontWeight="700" fill="#ffffff">
              Bắt đầu
            </text>
          </g>
        </g>
      </svg>

      {/* TOP-LEFT STATUS OVERLAY CHIP */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs text-slate-800 flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-extrabold text-slate-900 whitespace-nowrap">
            Xe đang ở đầu tuyến
          </span>
          <span className="text-slate-300">|</span>
          <span className="font-mono font-black text-blue-700 whitespace-nowrap">{distanceMeters}m</span>
        </div>
      </div>

      {/* BOTTOM-LEFT: Destination Address badge */}
      <div className="absolute bottom-3 left-3 z-30 pointer-events-none max-w-[200px] sm:max-w-[240px]">
        <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm border border-slate-200 text-[11px] font-bold text-slate-600 flex items-center gap-1.5 truncate">
          <MapPin size={13} className="text-rose-500 shrink-0" />
          <span className="truncate">Điểm đến: 48/12 Đường Số 8</span>
        </div>
      </div>

      {/* BOTTOM-RIGHT: MAP ZOOM CONTROLS */}
      <div className="absolute bottom-3 right-3 z-30 flex flex-col gap-1.5">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.4))}
            className="p-2 hover:bg-slate-100 text-slate-700 active:bg-slate-200 transition-colors border-b border-slate-100"
            title="Phóng to"
          >
            <Plus size={15} />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.9))}
            className="p-2 hover:bg-slate-100 text-slate-700 active:bg-slate-200 transition-colors"
            title="Thu nhỏ"
          >
            <Minus size={15} />
          </button>
        </div>

        <button
          onClick={() => {
            setZoomLevel(1);
            setProgress(0);
          }}
          className="bg-white p-2 rounded-xl shadow-md border border-slate-200 text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
          title="Căn giữa bản đồ"
        >
          <LocateFixed size={15} className="text-blue-600" />
        </button>
      </div>
    </div>
  );
};
