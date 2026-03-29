import React, { useState } from 'react';
import { Phone, Link, Trash2, Plus, Shield } from 'lucide-react';
import { toast } from 'sonner';
import type { LandingContentDTO } from '../../../hooks/useCMSContent';
import { SectionCard, FieldRow, TextInput, SaveButton } from '../shared';

interface FooterTabProps {
    cmsMap: Record<string, LandingContentDTO>;
    onSave: (id: string, v: string) => Promise<void>;
}

export const FooterTab: React.FC<FooterTabProps> = ({ cmsMap, onSave }) => {
    const find = (key: string) => Object.values(cmsMap).find(c => c.key === key);
    const [desc, setDesc] = useState(find('footer_description')?.content || 'نسعى دائماً لتقديم خدمات طبية متميزة تليق بكم.');
    const [address, setAddress] = useState(find('footer_address')?.content || 'المحلة الكبرى — محافظة الغربية');
    const [phone, setPhone] = useState(find('footer_phone')?.content || '');
    const [hours, setHours] = useState(find('footer_hours')?.content || '09:00 - 21:00');
    const [copyright, setCopyright] = useState(find('footer_copyright')?.content || 'جميع الحقوق محفوظة');
    const [facebookUrl, setFacebookUrl] = useState(find('footer_facebook')?.content || '');
    const [links, setLinks] = useState<string[]>(() => { try { return JSON.parse(find('footer_links')?.content || '[]'); } catch { return ['الرئيسية', 'خدماتنا', 'لماذا نحن؟', 'سياسة الخصوصية']; } });
    const [saving, setSaving] = useState(false);
    const [newLink, setNewLink] = useState('');

    const handleSave = async () => {
        setSaving(true);
        try {
            const saves = [
                { key: 'footer_description', val: desc }, { key: 'footer_address', val: address }, 
                { key: 'footer_phone', val: phone }, { key: 'footer_hours', val: hours }, 
                { key: 'footer_copyright', val: copyright }, { key: 'footer_facebook', val: facebookUrl },
                { key: 'footer_links', val: JSON.stringify(links) }
            ];
            for (const { key, val } of saves) { const item = find(key); if (item) await onSave(item.id, val); }
            toast.success('تم حفظ التذييل');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SectionCard title="بيانات التواصل الأساسية" icon={Phone}>
                    <div className="space-y-6">
                        <FieldRow label="وصف العيادة"><TextInput value={desc} onChange={setDesc} multiline /></FieldRow>
                        <FieldRow label="العنوان الجغرافي"><TextInput value={address} onChange={setAddress} /></FieldRow>
                        <FieldRow label="رقم الهاتف"><TextInput value={phone} onChange={setPhone} dir="ltr" /></FieldRow>
                        <FieldRow label="ساعات العمل"><TextInput value={hours} onChange={setHours} dir="ltr" /></FieldRow>
                        <FieldRow label="رابط فيسبوك"><TextInput value={facebookUrl} onChange={setFacebookUrl} dir="ltr" /></FieldRow>
                    </div>
                </SectionCard>
                <SectionCard title="روابط الفوتر" icon={Link}>
                    {links.map((link, i) => (
                        <div key={`footer-${i}-${link}`} className="group flex items-center gap-3 mb-4">
                            <TextInput value={link} onChange={e => setLinks(prev => prev.map((l, idx) => idx === i ? e : l))} />
                            <button onClick={() => setLinks(prev => prev.filter((_, idx) => idx !== i))} className="p-3 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-secondary-800 rounded-xl border border-slate-200 dark:border-secondary-700"><Trash2 className="w-5 h-5" /></button>
                        </div>
                    ))}
                    <div className="flex gap-3 pt-6 border-t mt-6">
                        <TextInput value={newLink} onChange={setNewLink} placeholder="أضف رابطاً..." />
                        <button onClick={() => { if (newLink.trim()) { setLinks(p => [...p, newLink.trim()]); setNewLink(''); } }} className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform"><Plus className="w-5 h-5" /></button>
                    </div>
                </SectionCard>
            </div>
            <SectionCard title="حقوق الملكية" icon={Shield}>
                <FieldRow label="نص حقوق النشر"><TextInput value={copyright} onChange={setCopyright} /></FieldRow>
            </SectionCard>
            <div className="flex justify-end"><SaveButton onClick={handleSave} saving={saving} /></div>
        </div>
    );
};
