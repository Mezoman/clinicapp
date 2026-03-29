import { useState, memo } from 'react';

const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28] as const;
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38] as const;

const STATUS_COLORS: Record<string, string> = {
    healthy: 'fill-green-500/10 stroke-green-500',
    decayed: 'fill-red-500/10 stroke-red-500',
    filled: 'fill-blue-500/10 stroke-blue-500',
    missing: 'fill-slate-500/10 stroke-slate-500',
    crowned: 'fill-amber-500/10 stroke-amber-500',
    extracted: 'fill-orange-500/10 stroke-orange-500',
};

const STATUS_LABELS: Record<string, string> = {
    healthy: 'سليم',
    decayed: 'تسوس',
    filled: 'حشو',
    missing: 'مفقود',
    crowned: 'تاج',
    extracted: 'مقلوع',
};

const ARABIC_NAMES: Record<number, string> = {
    18: 'ضرس العقل العلوي الأيمن', 17: 'الطاحن الثاني العلوي الأيمن', 16: 'الطاحن الأول العلوي الأيمن',
    15: 'الضاحك الثاني العلوي الأيمن', 14: 'الضاحك الأول العلوي الأيمن', 13: 'الناب العلوي الأيمن',
    12: 'الرباعية العلوية اليمنى', 11: 'الثنية العلوية اليمنى',
    21: 'الثنية العلوية اليسرى', 22: 'الرباعية العلوية اليسرى', 23: 'الناب العلوي الأيسر',
    24: 'الضاحك الأول العلوي الأيسر', 25: 'الضاحك الثاني العلوي الأيسر', 26: 'الطاحن الأول العلوي الأيسر',
    27: 'الطاحن الثاني العلوي الأيسر', 28: 'ضرس العقل العلوي الأيسر',
    31: 'الثنية السفلية اليسرى', 32: 'الرباعية السفلية اليسرى', 33: 'الناب السفلي الأيسر',
    34: 'الضاحك الأول السفلي الأيسر', 35: 'الضاحك الثاني السفلي الأيسر', 36: 'الطاحن الأول السفلي الأيسر',
    37: 'الطاحن الثاني السفلي الأيسر', 38: 'ضرس العقل السفلي الأيسر',
    41: 'الثنية السفلية اليمنى', 42: 'الرباعية السفلية اليمنى', 43: 'الناب السفلي الأيمن',
    44: 'الضاحك الأول السفلي الأيمن', 45: 'الضاحك الثاني السفلي الأيمن', 46: 'الطاحن الأول السفلي الأيمن',
    47: 'الطاحن الثاني السفلي الأيمن', 48: 'ضرس العقل السفلي الأيمن',
};

export type TeethData = Record<number, string>;

interface Props {
    readonly value: TeethData;
    readonly history?: Record<number, { readonly lastTreatment: string; readonly isTreated: boolean }>;
    readonly onChange?: (data: TeethData) => void;
    readonly readOnly?: boolean;
}

// ─── ToothSVG extracted outside TeethChart to prevent HMR crash and React remount ───
interface ToothSVGProps {
    readonly num: number;
    readonly value: TeethData;
    readonly history?: Record<number, { readonly lastTreatment: string; readonly isTreated: boolean }> | undefined;
    readonly selected: number | null;
    readonly readOnly: boolean;
    readonly onSelect: (num: number) => void;
}

const ToothSVG = memo(function ToothSVG({ num, value, history, selected, readOnly, onSelect }: ToothSVGProps) {
    const status = value[num] || 'healthy';
    const colorClass = STATUS_COLORS[status] || STATUS_COLORS.healthy;
    const isSelected = selected === num;
    const toothHistory = history?.[num];
    const toothName = ARABIC_NAMES[num] || `سن ${num}`;

    return (
        <div className="relative group/tooth">
            <button
                type="button"
                onClick={() => onSelect(num)}
                aria-label={`${toothName} - الحالة: ${STATUS_LABELS[status] || status}`}
                aria-pressed={isSelected}
                className={`flex flex-col items-center gap-0.5 outline-none ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95 transition-all'}`}
            >
                <span className={`text-[9px] font-black font-numbers ${isSelected ? 'text-primary' : 'text-[var(--text-secondary)]'}`}>
                    {num}
                </span>
                <svg width="24" height="28" viewBox="0 0 24 28" className="overflow-visible" aria-hidden="true">
                    <rect
                        x="2" y="2" width="20" height="24" rx="6"
                        className={`
                            ${isSelected ? 'fill-primary/20 stroke-primary stroke-[3]' : `${colorClass} stroke-2`}
                            transition-all duration-200
                            ${!readOnly ? 'group-hover/tooth:stroke-primary' : ''}
                        `}
                    />
                    {status === 'missing' && (
                        <line x1="6" y1="6" x2="18" y2="22" className="stroke-slate-500 stroke-2" />
                    )}
                    {toothHistory?.isTreated && !isSelected && (
                        <circle cx="12" cy="22" r="2.5" className="fill-primary animate-pulse" />
                    )}
                </svg>
            </button>

            {/* Tooltip */}
            <div
                role="tooltip"
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooth:block group-focus-within/tooth:block z-50 pointer-events-none"
            >
                <div className="bg-slate-900 dark:bg-slate-700 text-white text-[10px] py-1.5 px-2.5 rounded-xl whitespace-nowrap shadow-2xl border border-white/10">
                    <p className="font-black border-b border-white/10 pb-1 mb-1">{toothName}</p>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-current" style={{ backgroundColor: `var(--${status}-color, currentColor)` }} />
                        <p className="font-bold opacity-90">{STATUS_LABELS[status] || status}</p>
                    </div>
                    {toothHistory?.lastTreatment && (
                        <p className="text-primary-300 mt-1 font-medium">آخر علاج: {toothHistory.lastTreatment}</p>
                    )}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[6px] border-x-transparent border-t-[6px] border-t-slate-900 dark:border-t-slate-700" title="" />
                </div>
            </div>
        </div>
    );
});

// ─── Main TeethChart Component ───
const TeethChart = memo(function TeethChart({ value, history, onChange, readOnly = false }: Props) {
    const [selected, setSelected] = useState<number | null>(null);

    function handleToothClick(num: number) {
        if (readOnly) return;
        setSelected(num === selected ? null : num);
    }

    function setStatus(status: string) {
        if (selected === null) return;
        onChange?.({ ...value, [selected]: status });
    }

    return (
        <div className="space-y-6" role="application" aria-label="مخطط الأسنان">
            {/* Chart Area */}
            <div className="bg-[var(--bg-page)]/50 rounded-2xl p-4 border border-[var(--border-subtle)]/50 shadow-inner">
                <div className="space-y-4">
                    {/* Upper Teeth */}
                    <div className="flex justify-center gap-1 flex-wrap" role="group" aria-label="الأسنان العلوية">
                        {UPPER_TEETH.map(n => (
                            <ToothSVG key={n} num={n} value={value} history={history} selected={selected} readOnly={readOnly} onSelect={handleToothClick} />
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="relative py-2" aria-hidden="true">
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-[var(--border-subtle)]" />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--bg-card)] px-3 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest border border-[var(--border-subtle)] rounded-full">
                            خط الوسط
                        </span>
                    </div>

                    {/* Lower Teeth */}
                    <div className="flex justify-center gap-1 flex-wrap" role="group" aria-label="الأسنان السفلية">
                        {LOWER_TEETH.map(n => (
                            <ToothSVG key={n} num={n} value={value} history={history} selected={selected} readOnly={readOnly} onSelect={handleToothClick} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Status Picker */}
            {selected !== null && !readOnly && (
                <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-subtle)] shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-black text-[var(--text-primary)]">
                            السن {(selected).toLocaleString('ar-EG')} — <span className="text-[var(--text-secondary)] font-medium">{ARABIC_NAMES[selected]}</span>
                        </p>
                        <button
                            onClick={() => setSelected(null)}
                            className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest"
                        >
                            إلغاء التحديد
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setStatus(key)}
                                className={`
                                    px-4 py-2.5 rounded-xl text-xs font-black transition-all border
                                    ${(value[selected] || 'healthy') === key
                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                                        : 'bg-[var(--bg-page)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:border-primary/30 hover:bg-[var(--bg-card)]'}
                                `}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 justify-center py-2 border-t border-[var(--border-subtle)]/30" aria-label="دليل الألوان">
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[var(--bg-page)] transition-colors">
                        <div
                            className={`w-3 h-3 rounded-md border-2 ${STATUS_COLORS[key]}`}
                            aria-hidden="true"
                        />
                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default TeethChart;
