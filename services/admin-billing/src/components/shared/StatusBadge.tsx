import React from 'react';

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  const getStyle = () => {
    switch (status) {
      case 'PAID':
      case 'ACTIVE':
      case 'MATCHED':
      case 'RESTORED':
      case 'SUCCESS':
      case 'COMPLETED':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          ring: 'ring-emerald-200',
          dot: 'bg-emerald-500',
          defaultLabel: 'Đã thanh toán',
        };
      case 'UNPAID':
      case 'PENDING':
      case 'PENDING_VERIFICATION':
      case 'PROPOSED':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          ring: 'ring-amber-200',
          dot: 'bg-amber-500',
          defaultLabel: 'Chờ xử lý',
        };
      case 'OVERDUE':
      case 'FAILED':
      case 'SUSPENDED':
      case 'T_PLUS_30_CRITICAL':
      case 'ACTION_REQUIRED':
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          ring: 'ring-rose-200',
          dot: 'bg-rose-500',
          defaultLabel: 'Quá hạn / Ngừng phục vụ',
        };
      case 'DUPLICATE_FLAGGED':
        return {
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          ring: 'ring-purple-200',
          dot: 'bg-purple-500',
          defaultLabel: 'Đã chặn trùng lặp',
        };
      case 'MISMATCH_AMOUNT':
        return {
          bg: 'bg-orange-50',
          text: 'text-orange-700',
          ring: 'ring-orange-200',
          dot: 'bg-orange-500',
          defaultLabel: 'Lệch số tiền',
        };
      default:
        return {
          bg: 'bg-slate-50',
          text: 'text-slate-700',
          ring: 'ring-slate-200',
          dot: 'bg-slate-400',
          defaultLabel: status,
        };
    }
  };

  const style = getStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset whitespace-nowrap ${style.bg} ${style.text} ${style.ring} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {label || style.defaultLabel}
    </span>
  );
};
