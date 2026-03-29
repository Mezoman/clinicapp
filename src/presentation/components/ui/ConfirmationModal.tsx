import React, { useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'تأكيد',
    cancelLabel = 'إلغاء',
    onConfirm,
    onCancel,
    variant = 'danger'
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen, onCancel);

    if (!isOpen) return null;

    const variantClasses = {
        danger: 'bg-red-50 text-red-600',
        warning: 'bg-amber-50 text-amber-600',
        info: 'bg-blue-50 text-blue-600'
    };

    const btnClasses = {
        danger: 'bg-red-600 hover:bg-red-700 shadow-red-200',
        warning: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200',
        info: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                ref={modalRef}
                className="bg-white dark:bg-slate-800 rounded-none sm:rounded-[2.5rem] w-full h-full sm:h-auto max-w-none sm:max-w-md flex flex-col shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300"
                dir="rtl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirmation-modal-title"
            >
                <div className="p-8 text-center">
                    <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${variantClasses[variant]}`}>
                        <AlertTriangle className="w-8 h-8" />
                    </div>

                    <h3 id="confirmation-modal-title" className="text-2xl font-black text-gray-900 dark:text-white mb-2">{title}</h3>
                    <p className="text-gray-500 dark:text-slate-400 font-bold leading-[1.75]">{message}</p>
                </div>

                <div className="p-8 bg-gray-50/50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700 flex gap-4 mt-auto sm:mt-0">
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-4 rounded-2xl text-white font-black shadow-lg transition-all hover:-translate-y-1 ${btnClasses[variant]}`}
                    >
                        {confirmLabel}
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 py-4 rounded-2xl bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-300 font-black hover:bg-gray-50 transition-all"
                    >
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
