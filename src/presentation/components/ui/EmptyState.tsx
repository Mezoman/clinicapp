import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
    size?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    action,
    size = 'md'
}) => {
    const containerSize = {
        sm: 'p-6',
        md: 'p-12',
        lg: 'p-20'
    }[size];

    const iconSize = {
        sm: 'w-10 h-10',
        md: 'w-16 h-16',
        lg: 'w-24 h-24'
    }[size];

    return (
        <div className={`flex flex-col items-center justify-center text-center ${containerSize} animate-in`}>
            <div className="w-20 h-20 bg-gray-50 dark:bg-slate-700/50 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-gray-100 dark:border-slate-700">
                <Icon className={`text-gray-300 dark:text-slate-600 ${iconSize}`} strokeWidth={1.5} />
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>

            {description && (
                <p className="text-gray-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
                    {description}
                </p>
            )}

            {action && (
                <button
                    onClick={action.onClick}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:opacity-90 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                    {action.icon && <action.icon className="w-5 h-5" />}
                    {action.label}
                </button>
            )}
        </div>
    );
};
