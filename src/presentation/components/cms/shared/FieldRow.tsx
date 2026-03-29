import React from 'react';

export const FieldRow: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
    <div className="space-y-3 group">
        <label className="text-[10px] font-black text-slate-400 group-hover:text-primary-500 transition-colors uppercase tracking-widest block pr-2">
            {label}
        </label>
        {children}
        {hint && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pr-2">{hint}</p>}
    </div>
);
