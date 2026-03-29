import React, { useMemo, useCallback } from 'react';
import { CalendarDays, Clock, ToggleRight, ToggleLeft, X } from 'lucide-react';
import { WorkHoursTabProps } from '../types';
import { VisualDatePicker } from '../../calendar/VisualDatePicker';
import { formatDate, toISODateString } from '../../../../utils/dateUtils';
import type { ClinicShiftsDTO } from '../../../../application/dtos/settings.dto';

const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const WorkHoursTab: React.FC<WorkHoursTabProps> = React.memo(({ settings, setSettings, closures, onAddClosure, onRemoveClosure, toggleWorkingDay }) => {
    const updateShifts = useCallback(<K extends keyof ClinicShiftsDTO>(field: K, val: ClinicShiftsDTO[K]) => {
        setSettings(prev => prev ? { ...prev, shifts: { ...prev.shifts, [field]: val } } : null);
    }, [setSettings]);

    const disabledDatesArray = useMemo(() => closures.map(c => c.startDate), [closures]);

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <section className="bg-white dark:bg-secondary-900 rounded-[2.5rem] border border-slate-200 dark:border-secondary-800 shadow-sm p-10">
                <h3 className="text-xl font-black mb-10 text-slate-900 dark:text-white flex items-center gap-4 font-display">
                    <div className="size-10 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                        <CalendarDays aria-hidden={true} className="w-5 h-5 text-primary-500" />
                    </div>
                    أيام العمل الأسبوعية
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {DAY_NAMES.map((name, idx) => {
                        const active = settings.workingDays.includes(idx);
                        return (
                            <button
                                key={name}
                                aria-pressed={active}
                                onClick={() => toggleWorkingDay(idx)}
                                className={`px-6 py-5 rounded-[1.5rem] text-sm font-black transition-all border-2 ${
                                    active 
                                        ? 'bg-primary-500 border-primary-500 text-white shadow-xl shadow-primary-500/20 translate-y-[-4px]' 
                                        : 'bg-slate-50 dark:bg-secondary-800 border-slate-100 dark:border-secondary-700 text-slate-500 hover:border-primary-200'
                                }`}
                            >
                                {name}
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="bg-white dark:bg-secondary-900 rounded-[2.5rem] border border-slate-200 dark:border-secondary-800 shadow-sm p-10">
                <h3 className="text-xl font-black mb-10 text-slate-900 dark:text-white flex items-center gap-4 font-display">
                    <div className="size-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                        <Clock aria-hidden={true} className="w-5 h-5 text-amber-500" />
                    </div>
                    فترات العمل اليومية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="size-2 bg-primary-500 rounded-full animate-pulse" />
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">الفترة الصباحية</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-6 p-8 bg-slate-50/50 dark:bg-secondary-800/50 rounded-[2rem] border-[1.5px] border-slate-300 dark:border-secondary-700">
                            <div className="space-y-2">
                                <label htmlFor="eveningEnd" className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block text-center">النهاية</label>
                                <input id="morningStart" type="time" value={settings.shifts.morningStart} onChange={(e) => updateShifts('morningStart', e.target.value)} className="w-full bg-white dark:bg-secondary-900 border-none rounded-xl h-12 text-center text-sm font-black focus:ring-2 focus:ring-primary-500/50 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="morningEnd" className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block text-center">النهاية</label>
                                <input id="morningEnd" type="time" value={settings.shifts.morningEnd} onChange={(e) => updateShifts('morningEnd', e.target.value)} className="w-full bg-white dark:bg-secondary-900 border-none rounded-xl h-12 text-center text-sm font-black focus:ring-2 focus:ring-primary-500/50 transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className={`size-2 rounded-full ${settings.shifts.isEnabled ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`} />
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">الفترة المسائية</h4>
                            </div>
                            <button 
                                onClick={() => updateShifts('isEnabled', !settings.shifts.isEnabled)}
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center"
                                aria-label={settings.shifts.isEnabled ? "إيقاف الفترة المسائية" : "تفعيل الفترة المسائية"}
                            >
                                {settings.shifts.isEnabled ? <ToggleRight aria-hidden={true} className="w-8 h-8 text-primary-500" /> : <ToggleLeft aria-hidden={true} className="w-8 h-8 text-slate-300 dark:text-secondary-700" />}
                            </button>
                        </div>
                        <div className={`grid grid-cols-2 gap-6 p-8 bg-slate-50/50 dark:bg-secondary-800/50 rounded-[2rem] border-[1.5px] border-slate-300 dark:border-secondary-700 transition-all ${!settings.shifts.isEnabled && 'opacity-40 grayscale pointer-events-none'}`}>
                            <div className="space-y-2">
                                <label htmlFor="eveningStart" className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block text-center">البداية</label>
                                <input id="eveningStart" type="time" value={settings.shifts.eveningStart} onChange={(e) => updateShifts('eveningStart', e.target.value)} className="w-full bg-white dark:bg-secondary-900 border-none rounded-xl h-12 text-center text-sm font-black focus:ring-2 focus:ring-primary-500/50 transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="eveningEnd" className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block text-center">النهاية</label>
                                <input id="eveningEnd" type="time" value={settings.shifts.eveningEnd} onChange={(e) => updateShifts('eveningEnd', e.target.value)} className="w-full bg-white dark:bg-secondary-900 border-none rounded-xl h-12 text-center text-sm font-black focus:ring-2 focus:ring-primary-500/50 transition-all" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white dark:bg-secondary-900 rounded-[2.5rem] border border-slate-200 dark:border-secondary-800 shadow-sm p-10">
                <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-4 font-display">
                        <div className="size-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
                            <CalendarDays aria-hidden={true} className="w-5 h-5 text-red-500" />
                        </div>
                        فترات الإغلاق السنوية
                    </h3>
                    <button onClick={onAddClosure} className="bg-primary-500 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-600 transition-all">إضافة فترة إغلاق</button>
                </div>
                <div className="flex flex-col xl:flex-row gap-12">
                    <div className="w-full xl:w-72">
                        <VisualDatePicker selectedDate={toISODateString(new Date())} onSelect={onAddClosure} disabledDates={disabledDatesArray} />
                    </div>
                    <div className="flex-1 space-y-4">
                        <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 leading-[1.75]">قائمة الإجازات المسجلة</p>
                        {closures.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-100 dark:border-secondary-800 rounded-[2rem] text-center opacity-40">
                                <CalendarDays aria-hidden={true} className="w-16 h-16 text-slate-300 mb-4" />
                                <p className="text-sm font-black text-slate-500 uppercase tracking-widest leading-[1.75]">لا توجد عطلات قادمة مسجلة في الوقت الحالي</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                                {closures.map(c => (
                                    <div key={c.id} className="p-6 bg-slate-50 dark:bg-secondary-800 rounded-[1.5rem] border-[1.5px] border-slate-300 dark:border-secondary-700 flex items-center justify-between group hover:border-red-200 transition-all">
                                        <div>
                                            <h5 className="font-black text-slate-900 dark:text-white text-sm mb-1">{c.reason}</h5>
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{formatDate(c.startDate)} - {formatDate(c.endDate)}</p>
                                        </div>
                                        <button onClick={() => onRemoveClosure(c.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all" aria-label={`إزالة ${c.reason}`}><X aria-hidden={true} className="w-5 h-5" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
});
