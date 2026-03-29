import React from 'react';

export const TextInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; dir?: 'rtl' | 'ltr'; multiline?: boolean }> = ({ value, onChange, placeholder, dir = 'rtl', multiline }) => {
    const className = "w-full bg-slate-50 dark:bg-secondary-800 border-[1.5px] border-slate-200 dark:border-secondary-700 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-400";
    return multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} dir={dir} className={`${className} min-h-[120px] resize-none leading-relaxed`} />
    ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} dir={dir} className={className} />
    );
};
