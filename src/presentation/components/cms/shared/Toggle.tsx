import React from 'react';

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
    <button
        onClick={() => onChange(!checked)}
        className="flex items-center gap-4 group text-right"
    >
        <div className={`w-12 h-6 rounded-full relative transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-secondary-800'}`}>
            <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${checked ? 'right-7' : 'right-1'}`} />
        </div>
        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{label}</span>
    </button>
);
