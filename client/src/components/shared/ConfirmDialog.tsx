import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const variantConfig = {
    danger: {
      bgIcon: 'bg-rose-50 text-rose-600 border border-rose-200',
      icon: AlertTriangle,
      btnClass: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white focus:ring-rose-500',
    },
    warning: {
      bgIcon: 'bg-amber-50 text-amber-600 border border-amber-200',
      icon: AlertCircle,
      btnClass: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white focus:ring-amber-500',
    },
    info: {
      bgIcon: 'bg-cyan-50 text-cyan-600 border border-cyan-200',
      icon: Info,
      btnClass: 'bg-[#101B2D] hover:bg-[#17263D] text-white focus:ring-[#19B8C9]',
    },
  };

  const { bgIcon, icon: IconComponent, btnClass } = variantConfig[variant];

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={isLoading ? undefined : onCancel} />
      <div className="modal-content max-w-md w-full p-6">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ${bgIcon}`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-base font-bold text-[#172337] tracking-tight">{title}</h3>
            <p className="mt-1.5 text-xs sm:text-sm text-[#65748B] leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-6 flex gap-2.5 justify-end pt-4 border-t border-[#E3E9F0]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`btn ${btnClass}`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

