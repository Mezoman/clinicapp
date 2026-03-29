import React from 'react';
import { Save, Loader2 } from 'lucide-react';

export const SaveButton: React.FC<{ onClick: () => void; saving: boolean; label?: string }> = ({ onClick, saving, label = "حفظ التغييرات" }) => (
    <button
        onClick={onClick}
        disabled={saving}
        className="flex items-center gap-3 px-10 h-14 bg-primary-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/30 hover:bg-primary-600 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all"
    >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'جاري الحفظ...' : label}
    </button>
);
