import React from 'react';

interface SectionCardProps {
    title: string;
    icon: any;
    children: React.ReactNode;
    onBack?: () => void;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, icon: Icon, children, onBack }) => (
    <div className="bg-white dark:bg-secondary-900 rounded-[2.5rem] border-[1.5px] border-[var(--border-color)] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-8 border-b-[1.5px] border-[var(--border-subtle)] bg-slate-50/30 dark:bg-black/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="size-10 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-500">
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">{title}</h3>
            </div>
            {onBack && (
                <button onClick={onBack} className="text-xs font-black text-primary hover:text-primary-600 uppercase tracking-widest flex items-center gap-2 transition-colors">
                    <span>عودة للكل</span>
                </button>
            )}
        </div>
        <div className="p-8">{children}</div>
    </div>
);
