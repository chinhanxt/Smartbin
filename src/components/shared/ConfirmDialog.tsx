import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'success';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  variant = 'primary',
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          btn: 'bg-destructive text-white hover:bg-red-600',
          icon: <AlertCircle className="text-destructive h-6 w-6 shrink-0" />,
        };
      case 'success':
        return {
          btn: 'bg-emerald-600 text-white hover:bg-emerald-700',
          icon: <CheckCircle className="text-emerald-600 h-6 w-6 shrink-0" />,
        };
      default:
        return {
          btn: 'bg-primary text-primary-foreground hover:bg-primary/90',
          icon: <Info className="text-primary h-6 w-6 shrink-0" />,
        };
    }
  };

  const currentVariant = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {currentVariant.icon}
            <h3 className="text-lg font-bold text-foreground leading-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold shadow-md transition-colors ${currentVariant.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
