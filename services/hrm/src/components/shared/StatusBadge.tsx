import React from 'react';

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'sm' }) => {
  const getStyle = () => {
    switch (status) {
      case 'ACTIVE':
      case 'COMPLETED':
      case 'ON_TIME':
      case 'APPROVED':
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-200 border-emerald-200';

      case 'IN_PROGRESS':
      case 'SCHEDULED':
        return 'bg-blue-50 text-primary ring-blue-200 border-blue-200';

      case 'STANDBY':
      case 'PENDING':
      case 'DRAFT':
        return 'bg-amber-50 text-amber-800 ring-amber-200 border-amber-200';

      case 'ON_LEAVE':
      case 'ABSENT':
      case 'LATE':
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 ring-rose-200 border-rose-200';

      default:
        return 'bg-slate-50 text-slate-700 ring-slate-200 border-slate-200';
    }
  };

  const getDefaultLabel = () => {
    switch (status) {
      case 'ACTIVE': return 'Đang làm việc';
      case 'ON_LEAVE': return 'Đang nghỉ phép';
      case 'STANDBY': return 'Trực dự phòng';
      case 'SCHEDULED': return 'Đã lên lịch';
      case 'IN_PROGRESS': return 'Đang thực hiện';
      case 'COMPLETED': return 'Đã hoàn thành';
      case 'ON_TIME': return 'Đúng giờ';
      case 'LATE': return 'Đi trễ';
      case 'APPROVED': return 'Đã duyệt';
      case 'PENDING': return 'Chờ duyệt';
      case 'PAID': return 'Đã chi trả';
      case 'DRAFT': return 'Bản nháp';
      default: return status;
    }
  };

  const sizeCls = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-full border ring-1 ring-inset ${sizeCls} ${getStyle()} whitespace-nowrap`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      <span>{label || getDefaultLabel()}</span>
    </span>
  );
};
