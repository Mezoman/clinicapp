import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: number | undefined;       // Change percentage (positive = up, negative = down)
    changeLabel?: string;
    icon: LucideIcon;
    colorScheme: 'blue' | 'green' | 'orange' | 'purple' | 'red';
    loading?: boolean;
    onClick?: () => void | Promise<void>;
}

const colorConfigs = {
    blue: { bg: 'bg-blue-50/50 dark:bg-blue-900/10', iconBg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100/50 dark:border-blue-900/20' },
    green: { bg: 'bg-emerald-50/50 dark:bg-emerald-900/10', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100/50 dark:border-emerald-900/20' },
    orange: { bg: 'bg-orange-50/50 dark:bg-orange-900/10', iconBg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-100/50 dark:border-orange-900/20' },
    purple: { bg: 'bg-purple-50/50 dark:bg-purple-900/10', iconBg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-100/50 dark:border-purple-900/20' },
    red: { bg: 'bg-red-50/50 dark:bg-red-900/10', iconBg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-100/50 dark:border-red-900/20' },
};

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    change,
    changeLabel = 'منذ الشهر الماضي',
    icon: Icon,
    colorScheme,
    loading = false,
    onClick
}) => {
    const config = colorConfigs[colorScheme];
    const counted = useCountUp(typeof value === 'number' ? value : 0);
    const animatedValue = typeof value === 'number' ? counted : value;

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm animate-pulse">
                <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 bg-gray-100 dark:bg-slate-700 rounded-xl" />
                    <div className="h-6 w-16 bg-gray-50 dark:bg-slate-700 rounded-full" />
                </div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-50 dark:bg-slate-700 rounded w-24" />
                    <div className="h-8 bg-gray-100 dark:bg-slate-700 rounded w-32" />
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            className={`
        p-6 rounded-2xl border shadow-sm transition-all duration-300
        ${config.bg} ${config.border}
        ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}
        group
      `}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl transition-colors duration-300 ${config.iconBg}`}>
                    <Icon className={`w-6 h-6 ${config.text}`} />
                </div>

                {change !== undefined && (
                    <div className={`
            flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold
            ${change >= 0 ? 'bg-emerald-100/80 text-emerald-700' : 'bg-red-100/80 text-red-700'}
          `}>
                        {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{Math.abs(change)}%</span>
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white transition-all group-hover:scale-105 origin-right">
                        {typeof animatedValue === 'number' ? animatedValue.toLocaleString('ar-EG') : animatedValue}
                    </h3>
                </div>
                {changeLabel && change !== undefined && (
                    <p className="text-xs text-gray-400 dark:text-slate-500">{changeLabel}</p>
                )}
            </div>
        </div>
    );
};
