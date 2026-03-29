import React, { useState } from 'react';
import { Layout, GraduationCap, X, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import type { LandingContentDTO } from '../../../hooks/useCMSContent';
import { SectionCard, FieldRow, TextInput, SaveButton } from '../shared';

interface CredentialDTO {
    id: string;
    title: string;
    year: string;
    institution: string;
    type: string;
    visible: boolean;
}

interface CredentialsTabProps {
    cmsMap: Record<string, LandingContentDTO>;
    onSave: (id: string, v: string) => Promise<void>;
}

export const CredentialsTab: React.FC<CredentialsTabProps> = ({ cmsMap, onSave }) => {
    const find = (key: string) => Object.values(cmsMap).find(c => c.key === key);
    const [creds, setCreds] = useState<CredentialDTO[]>(() => { try { return JSON.parse(find('credentials_list')?.content || '[]'); } catch { return []; } });
    const [sectionTitle, setSectionTitle] = useState(find('credentials_title')?.content || 'المؤهلات والاعتمادات');
    const [saving, setSaving] = useState(false);
    const [editIdx, setEditIdx] = useState<number | null>(null);

    const updateCred = <K extends keyof CredentialDTO>(i: number, field: K, val: CredentialDTO[K]) => setCreds(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

    const handleSave = async () => {
        setSaving(true);
        try {
            const item = find('credentials_list');
            const titleItem = find('credentials_title');
            if (item) await onSave(item.id, JSON.stringify(creds));
            if (titleItem) await onSave(titleItem.id, sectionTitle);
            toast.success('تم حفظ المؤهلات العلمية');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionCard title="رأس قسم الاعتمادات" icon={Layout}>
                <FieldRow label="عنوان قسم المؤهلات"><TextInput value={sectionTitle} onChange={setSectionTitle} /></FieldRow>
            </SectionCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {creds.map((c, i) => (
                    <div 
                        key={`cred-${i}-${c.year}`} 
                        onClick={() => setEditIdx(i)} 
                        className={`group relative p-6 rounded-[2rem] border-[1.5px] transition-all cursor-pointer ${editIdx === i ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-primary/50'}`}
                    >
                        <div className="flex items-center gap-5">
                            <div className="size-14 rounded-2xl bg-secondary-900 flex items-center justify-center text-primary-500"><Trophy className="size-7" /></div>
                            <div className="flex-1">
                                <h3 className="text-base font-black text-slate-900 mb-1">{c.year}</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{c.title}</p>
                            </div>
                            <button onClick={e => { e.stopPropagation(); setCreds(prev => prev.filter((_, idx) => idx !== i)); if (editIdx === i) setEditIdx(null); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X className="size-5" /></button>
                        </div>
                    </div>
                ))}
            </div>
            {editIdx !== null && creds[editIdx] && (
                <SectionCard title={`تعديل: ${creds[editIdx].year}`} icon={GraduationCap} onBack={() => setEditIdx(null)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FieldRow label="المؤهل"><TextInput value={creds[editIdx].title} onChange={v => updateCred(editIdx, 'title', v)} /></FieldRow>
                        <FieldRow label="السنة"><TextInput value={creds[editIdx].year} onChange={v => updateCred(editIdx, 'year', v)} /></FieldRow>
                    </div>
                </SectionCard>
            )}
            <div className="flex justify-end"><SaveButton onClick={handleSave} saving={saving} /></div>
        </div>
    );
};
