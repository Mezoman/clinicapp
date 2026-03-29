import React from 'react';
import {
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Activity,
    CreditCard,
    Ban
} from 'lucide-react';

export type BadgeVariant =
    | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
    | 'paid' | 'partial' | 'unpaid' | 'overdue'
    | 'active' | 'inactive'
    | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
    variant: BadgeVariant;
    children?: React.ReactNode;
    showIcon?: boolean;
    className?: string;
}

const variantConfig: Record<BadgeVariant, {
    bg: string;
    text: string;
    label: string;
    icon: React.ElementType;
}> = {
    pending: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', label: 'قيد الانتظار', icon: Clock },
    confirmed: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', label: 'مؤكد', icon: CheckCircle2 },
    completed: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', label: 'مكتمل', icon: CheckCircle2 },
    cancelled: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', label: 'ملغي', icon: XCircle },
    'no-show': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', label: 'لم يحضر', icon: Ban },

    paid: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', label: 'مدفوع', icon: CreditCard },
    partial: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', label: 'مدفوع جزئياً', icon: CreditCard },
    unpaid: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', label: 'غير مدفوع', icon: AlertTriangle },
    overdue: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', label: 'متأخر', icon: Clock },

    active: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', label: 'نشط', icon: Activity },
    inactive: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', label: 'معطل', icon: Ban },

    success: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', label: 'نجاح', icon: CheckCircle2 },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', label: 'تنبيه', icon: AlertTriangle },
    danger: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', label: 'خطأ', icon: XCircle },
    info: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', label: 'معلومة', icon: Clock },
    neutral: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', label: 'عادي', icon: Activity },
};

export const Badge: React.FC<BadgeProps> = ({
    variant,
    children,
    showIcon = true,
    className = ""
}) => {
    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
        <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold
      ${config.bg} ${config.text} ${className}
    `}>
            {showIcon && <Icon className="w-3.5 h-3.5" />}
            {children || config.label}
        </span>
    );
};
