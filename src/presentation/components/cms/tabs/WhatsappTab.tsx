import React, { useState } from 'react';
import { MessageCircle, Eye, Globe } from 'lucide-react';
import { toast } from 'sonner';
import type { LandingContentDTO } from '../../../hooks/useCMSContent';
import { SectionCard, FieldRow, TextInput, Toggle, SaveButton } from '../shared';

interface WhatsappTabProps {
    cmsMap: Record<string, LandingContentDTO>;
    onSave: (id: string, v: string) => Promise<void>;
}

export const WhatsappTab: React.FC<WhatsappTabProps> = ({ cmsMap, onSave }) => {
    const find = (key: string) => Object.values(cmsMap).find(c => c.key === key);
    const [number, setNumber] = useState(find('whatsapp_number')?.content || '');
    const [message, setMessage] = useState(find('whatsapp_message')?.content || 'مرحباً دكتور محمد، أود الاستفسار عن...');
    const [buttonText, setButtonText] = useState(find('whatsapp_button_text')?.content || 'تواصل معنا عبر واتساب');
    const [showFloat, setShowFloat] = useState(find('whatsapp_show_float')?.content === 'true');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const saves = [{ key: 'whatsapp_number', val: number }, { key: 'whatsapp_message', val: message }, { key: 'whatsapp_button_text', val: buttonText }, { key: 'whatsapp_show_float', val: showFloat ? 'true' : 'false' }];
            for (const { key, val } of saves) {
                const item = find(key);
                if (item) await onSave(item.id, val);
            }
            toast.success('تم حفظ إعدادات واتساب');
        } finally {
            setSaving(false);
        }
    };

    const previewUrl = number ? `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}` : '';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SectionCard title="التواصل الفوري" icon={MessageCircle}>
                    <div className="space-y-6">
                        <Toggle checked={showFloat} onChange={setShowFloat} label="تفعيل الزر العائم" />
                        <FieldRow label="رقم الجوال"><TextInput value={number} onChange={setNumber} dir="ltr" /></FieldRow>
                        <FieldRow label="نص الزر"><TextInput value={buttonText} onChange={setButtonText} /></FieldRow>
                        <FieldRow label="رسالة الترحيب"><TextInput value={message} onChange={setMessage} multiline /></FieldRow>
                    </div>
                </SectionCard>
                <SectionCard title="معاينة" icon={Eye}>
                    {previewUrl && (
                        <div className="p-6 bg-emerald-500/10 border-[1.5px] border-emerald-500/20 rounded-[2rem] flex items-center justify-between group shadow-sm">
                            <p className="text-xs font-black text-emerald-800 uppercase tracking-widest truncate flex-1 ltr pr-4">{previewUrl}</p>
                            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="size-11 bg-emerald-600 text-white rounded-[1.25rem] flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 shadow-emerald-600/30 shadow-xl overflow-hidden"><Globe className="size-5" /></a>
                        </div>
                    )}
                </SectionCard>
            </div>
            <div className="flex justify-end"><SaveButton onClick={handleSave} saving={saving} /></div>
        </div>
    );
};
