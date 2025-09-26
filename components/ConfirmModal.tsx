import React from 'react';
import Icon from './Icon';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  iconName?: string;
  iconBgClass?: string;
  iconColorClass?: string;
  confirmBtnClass?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message,
    iconName = 'warning',
    iconBgClass = 'bg-yellow-100',
    iconColorClass = 'text-yellow-500',
    confirmBtnClass = 'bg-red-500 hover:bg-red-600'
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center transition-opacity duration-300 animate-[fade-in_0.2s_ease-out]"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative bg-white rounded-3xl shadow-xl w-full max-w-sm m-4 p-6 text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${iconBgClass} mb-4`}>
            <Icon name={iconName} className={`text-2xl ${iconColorClass}`} />
        </div>
        
        <h3 className="text-lg font-semibold text-slate-800" id="modal-title">
          {title}
        </h3>
        <div className="mt-2">
          <p className="text-sm text-slate-500">
            {message}
          </p>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            className={`inline-flex justify-center rounded-full border border-transparent px-6 py-2 text-base font-semibold text-white shadow-sm transition-colors focus:outline-none ${confirmBtnClass}`}
            onClick={handleConfirm}
          >
            Confirm
          </button>
          <button
            type="button"
            className="inline-flex justify-center rounded-full border border-slate-300 bg-white px-6 py-2 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors focus:outline-none"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;