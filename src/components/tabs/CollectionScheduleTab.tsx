import React, { useState } from 'react';
import { 
  Truck, 
  Calendar, 
  Clock, 
  MapPin, 
  Navigation, 
  Phone, 
  BellRing, 
  Compass, 
  Radio
} from 'lucide-react';
import { CollectionScheduleItem } from '../../types';
import { StatusBadge } from '../shared/StatusBadge';
import { ShopeeTrackingMap } from '../shared/ShopeeTrackingMap';

interface CollectionScheduleTabProps {
  schedules: CollectionScheduleItem[];
  userAddress: string;
}

export const CollectionScheduleTab: React.FC<CollectionScheduleTabProps> = ({
  schedules,
  userAddress
}) => {
  const [reminderSet, setReminderSet] = useState(false);
  const activeToday = schedules.find((s) => s.status === 'EN_ROUTE' || s.status === 'COLLECTING') || schedules[0];
  const vehicle = activeToday?.assignedVehicle;

  return (
    <div className="space-y-6">
      {/* Header: Concise, punchy, no long subtext */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Lịch Thu Gom & Vị Trí Xe GPS
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Giám sát thời gian thực xe thu gom rác tại tuyến đường nhà bạn.
          </p>
        </div>

        <button
          onClick={() => setReminderSet(!reminderSet)}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors shadow-sm whitespace-nowrap ${
            reminderSet 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          <BellRing size={18} />
          {reminderSet ? 'Đã bật nhắc nhở 15 phút' : 'Nhắc tôi khi xe sắp đến'}
        </button>
      </div>

      {/* SIGNATURE SECTION: LIVE RADAR & TRUCK TRACKER */}
      {vehicle && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Info: Large ETA, clear stats, no text wrapping (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Badges strip */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 ring-1 ring-inset ring-violet-200 whitespace-nowrap">
                  <Radio size={13} className="text-violet-600 animate-pulse" />
                  Trực tiếp GPS Traccar
                </span>
                <StatusBadge status="EN_ROUTE" label="Xe đang đến khu phố" />
              </div>

              {/* Big ETA Display: Bold, clear, no awkward wrapping */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Thời gian dự kiến xe đến (ETA)
                </span>
                <div className="mt-1 flex items-baseline gap-2 whitespace-nowrap">
                  <span className="text-5xl font-black font-mono text-primary tracking-tight">
                    ~{vehicle.etaMinutes}
                  </span>
                  <span className="text-xl font-bold text-foreground">
                    phút nữa
                  </span>
                </div>
                <div className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                  <span>Khoảng cách:</span>
                  <strong className="text-foreground font-mono text-base">{vehicle.distanceMeters}m</strong>
                  <span>•</span>
                  <span>Tốc độ:</span>
                  <strong className="text-foreground font-mono text-base">{vehicle.speedKmH} km/h</strong>
                </div>
              </div>

              {/* Driver & Vehicle Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                {/* Truck */}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shrink-0">
                    <Truck size={24} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs text-muted-foreground font-medium block">Biển số xe ép rác</span>
                    <span className="font-mono text-xl font-black text-foreground block whitespace-nowrap">
                      {vehicle.plateNumber}
                    </span>
                  </div>
                </div>

                {/* Driver */}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shadow-sm shrink-0">
                    <Navigation size={22} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs text-muted-foreground font-medium block">Tài xế phụ trách</span>
                    <span className="text-base font-bold text-foreground block truncate">
                      {vehicle.driverName}
                    </span>
                    <a 
                      href={`tel:${vehicle.driverPhone}`} 
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1 mt-0.5 whitespace-nowrap"
                    >
                      <Phone size={12} /> {vehicle.driverPhone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Notice chip */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 text-xs font-medium border border-blue-200/60 whitespace-nowrap">
                <span>⏰</span>
                <span>Vui lòng chuẩn bị thùng rác trước <strong>07:45</strong></span>
              </div>
            </div>

            {/* Right: Realistic Shopee-style light map (5 cols) */}
            <div className="lg:col-span-5">
              <ShopeeTrackingMap
                plateNumber={vehicle.plateNumber}
                driverName={vehicle.driverName}
                etaMinutes={vehicle.etaMinutes}
                distanceMeters={vehicle.distanceMeters}
                speedKmH={vehicle.speedKmH}
                homeAddress={userAddress}
              />
            </div>
          </div>
        </div>
      )}

      {/* WEEKLY TIMETABLE TABLE: Large fonts, nowrap headers, clear data */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar size={20} />
            </div>
            <h2 className="text-lg font-bold text-card-foreground">
              Lịch Thu Gom Định Kỳ
            </h2>
          </div>
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
            Khu phố 3, P. Hiệp Phú
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/60 text-xs font-bold uppercase text-muted-foreground whitespace-nowrap">
              <tr>
                <th className="px-5 py-3.5">Thời Gian</th>
                <th className="px-5 py-3.5">Loại Rác</th>
                <th className="px-5 py-3.5">Trạng Thái</th>
                <th className="px-5 py-3.5">Ghi Chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {schedules.map((item) => (
                <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-bold text-base text-foreground">
                      {item.dayName}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                      <Clock size={12} /> {item.timeSlot}
                    </div>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="font-bold text-base text-foreground block">
                      {item.categoryLabel}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Ngày {item.dateStr}
                    </span>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <StatusBadge status={item.status} />
                  </td>

                  <td className="px-5 py-4 text-sm font-medium text-muted-foreground leading-normal">
                    {item.notes}
                    {item.completionTime && (
                      <span className="block text-emerald-700 font-bold text-xs mt-1">
                        ✓ {item.completionTime}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
