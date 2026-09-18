import React from 'react';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className }) => {
  let colorClasses = 'bg-slate-50 text-slate-700 ring-slate-200';
  let defaultLabel = label || status;

  switch (status) {
    // Household & Bin states
    case 'ACTIVE':
    case 'PAIRED':
    case 'ONLINE':
      colorClasses = 'bg-emerald-50 text-emerald-700 ring-emerald-200';
      if (!label) defaultLabel = status === 'PAIRED' ? 'Đã liên kết' : 'Đang hoạt động';
      break;
    case 'PENDING_VERIFY':
    case 'UNPAIRED':
      colorClasses = 'bg-amber-50 text-amber-700 ring-amber-200';
      if (!label) defaultLabel = status === 'UNPAIRED' ? 'Chưa liên kết' : 'Chờ xác thực';
      break;
    case 'SUSPENDED':
    case 'SENSOR_FAULT':
    case 'OFFLINE':
      colorClasses = 'bg-red-50 text-red-700 ring-red-200';
      if (!label) defaultLabel = status === 'SENSOR_FAULT' ? 'Lỗi cảm biến' : 'Mất kết nối';
      break;

    // Fill & Odor states
    case 'NORMAL':
    case 'SAFE':
      colorClasses = 'bg-emerald-50 text-emerald-700 ring-emerald-200';
      if (!label) defaultLabel = 'Bình thường';
      break;
    case 'WARNING_HIGH':
    case 'CAUTION':
      colorClasses = 'bg-amber-50 text-amber-700 ring-amber-200';
      if (!label) defaultLabel = 'Cảnh báo mức cao';
      break;
    case 'CRITICAL_FULL':
    case 'CRITICAL_ODOR':
      colorClasses = 'bg-red-50 text-red-700 ring-red-200';
      if (!label) defaultLabel = 'Đầy khẩn cấp';
      break;

    // Schedule states
    case 'UPCOMING':
      colorClasses = 'bg-blue-50 text-blue-700 ring-blue-200';
      if (!label) defaultLabel = 'Sắp diễn ra';
      break;
    case 'EN_ROUTE':
      colorClasses = 'bg-violet-50 text-violet-700 ring-violet-200';
      if (!label) defaultLabel = 'Xe đang đến';
      break;
    case 'COLLECTING':
      colorClasses = 'bg-indigo-50 text-indigo-700 ring-indigo-200';
      if (!label) defaultLabel = 'Đang thu gom';
      break;
    case 'COMPLETED':
      colorClasses = 'bg-emerald-50 text-emerald-700 ring-emerald-200';
      if (!label) defaultLabel = 'Đã thu gom';
      break;
    case 'MISSED':
      colorClasses = 'bg-rose-50 text-rose-700 ring-rose-200';
      if (!label) defaultLabel = 'Bị bỏ sót';
      break;

    // Complaint Lifecycle States
    case 'RECEIVED':
      colorClasses = 'bg-blue-50 text-blue-700 ring-blue-200';
      if (!label) defaultLabel = 'Đã tiếp nhận';
      break;
    case 'VERIFYING':
      colorClasses = 'bg-amber-50 text-amber-700 ring-amber-200';
      if (!label) defaultLabel = 'Đang xác minh';
      break;
    case 'DISPATCHED_RESOLVE':
      colorClasses = 'bg-violet-50 text-violet-700 ring-violet-200';
      if (!label) defaultLabel = 'Đã điều xe xử lý';
      break;
    case 'RESOLVED':
      colorClasses = 'bg-emerald-50 text-emerald-700 ring-emerald-200';
      if (!label) defaultLabel = 'Đã giải quyết';
      break;
    case 'REJECTED':
      colorClasses = 'bg-slate-50 text-slate-700 ring-slate-200';
      if (!label) defaultLabel = 'Từ chối';
      break;

    default:
      colorClasses = 'bg-slate-50 text-slate-700 ring-slate-200';
      break;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        colorClasses,
        className
      )}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-75" />
      {defaultLabel}
    </span>
  );
};
