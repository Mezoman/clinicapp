import React, { useCallback } from 'react';
import { Building, Palette, Loader2, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ClinicInfoTabProps } from '../types';
import { useCMSContent } from '../../../hooks/useCMSContent';
import type { ClinicSettingsDTO } from '../../../../application/dtos/settings.dto';

export const ClinicInfoTab: React.FC<ClinicInfoTabProps> = ({ settings, setSettings, onSave: _onSave, saving: _saving }) => {
    const update = useCallback(<K extends keyof ClinicSettingsDTO>(field: K, val: ClinicSettingsDTO[K]) => {
        setSettings(prev => prev ? { ...prev, [field]: val } : null);
    }, [setSettings]);
    
    // Connect to routing and CMS content to fetch the logo
    const navigate = useNavigate();
    const { cmsMap, loading } = useCMSContent();
    const logoUrl = cmsMap['logo']?.content;

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <section className="bg-white dark:bg-secondary-900 rounded-[2.5rem] border-[1.5px] border-slate-300 dark:border-secondary-800 shadow-sm p-10">
                <h3 className="text-xl font-black mb-8 text-slate-900 dark:text-white flex items-center gap-4 font-display">
                    <div className="size-10 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                        <Building aria-hidden={true} className="w-5 h-5 text-primary-500" />
                    </div>
                    بيانات العيادة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label htmlFor="address" className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mr-2">العنوان</label>
                        <input id="clinicName" className="w-full bg-slate-50 dark:bg-secondary-800 border-none rounded-2xl h-14 px-6 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 outline-none transition-all" type="text" value={settings.clinicName || ''} onChange={(e) => update('clinicName', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="doctorName" className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mr-2">اسم الطبيب</label>
                        <input id="doctorName" className="w-full bg-slate-50 dark:bg-secondary-800 border-none rounded-2xl h-14 px-6 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 outline-none transition-all" type="text" value={settings.doctorName || ''} onChange={(e) => update('doctorName', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="phone" className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mr-2">رقم الهاتف</label>
                        <input id="phone" className="w-full bg-slate-50 dark:bg-secondary-800 border-none rounded-2xl h-14 px-6 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 outline-none transition-all text-left" dir="ltr" type="tel" value={settings.phone || ''} onChange={(e) => update('phone', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="whatsapp" className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mr-2">رقم الواتساب</label>
                        <input id="whatsapp" className="w-full bg-slate-50 dark:bg-secondary-800 border-none rounded-2xl h-14 px-6 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 outline-none transition-all text-left" dir="ltr" type="tel" value={settings.whatsapp || ''} onChange={(e) => update('whatsapp', e.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label htmlFor="address" className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mr-2">العنوان</label>
                        <input id="address" className="w-full bg-slate-50 dark:bg-secondary-800 border-none rounded-2xl h-14 px-6 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 outline-none transition-all" type="text" value={settings.address || ''} onChange={(e) => update('address', e.target.value)} />
                    </div>
                </div>

                <div className="mt-12">
                    <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mr-2 mb-3 block">شعار العيادة (الهوية البصرية)</p>
                    <div className="border-[1.5px] border-slate-300 dark:border-secondary-800 rounded-[2rem] p-8 bg-slate-50/50 dark:bg-secondary-800/20 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                        <div className="flex items-center gap-6">
                            <div className="size-24 shrink-0 rounded-[1.5rem] bg-white dark:bg-secondary-800 border-[1.5px] border-slate-300 dark:border-secondary-700 p-2 flex items-center justify-center shadow-sm">
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" role="status" aria-label="جاري التحميل..." />
                                ) : logoUrl ? (
                                    <img src={logoUrl} alt="Clinic Logo" className="w-max h-max max-w-full max-h-full object-contain drop-shadow-sm" />
                                ) : (
                                    <Palette aria-hidden={true} className="w-8 h-8 text-slate-300 dark:text-secondary-600" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white mb-2">الشعار الحالي للنظام</p>
                                <p className="text-xs font-black text-slate-600 dark:text-slate-400 leading-[1.75] uppercase tracking-widest">
                                    هذه المعاينة تسحب الشعار من قاعدة الهوية العامة.<br/>
                                    لرفع أو استبدال الشعار بصيغ PNG/SVG، توجه لإدارة الموقع.
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/admin/cms')}
                            className="shrink-0 group bg-white dark:bg-secondary-900 hover:bg-slate-50 dark:hover:bg-secondary-800 border-[1.5px] border-slate-300 dark:border-secondary-700 w-full md:w-auto mt-4 md:mt-0 px-6 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-3 text-slate-700 dark:text-slate-300"
                        >
                            <LinkIcon aria-hidden={true} className="w-4 h-4 text-slate-400 group-hover:text-primary-500 transition-colors" />
                            <span>تعديل من إدارة الموقع (CMS)</span>
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};
