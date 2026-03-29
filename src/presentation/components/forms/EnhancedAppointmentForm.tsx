import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
    Clock,
    CheckCircle,
    Loader2,
    MessageCircle
} from 'lucide-react';
import { app } from '../../../application/container';
import { PatientDTO } from '../../../application/dtos/patient.dto';
import { ClinicSettingsDTO } from '../../../application/dtos/settings.dto';
import { AppointmentTypeDTO } from '../../../application/dtos/appointment.dto';
import { APPOINTMENT_TYPE_MAP } from '../../../constants';
import {
    formatTime,
    generateTimeSlots,
    toISODateString
} from '../../../utils/dateUtils';
import { PatientCombobox } from '../ui/PatientCombobox';

interface EnhancedAppointmentFormProps {
    initialDate?: string | undefined;
    initialTime?: string | undefined;
    settings: ClinicSettingsDTO;
    onClose: () => void;
    onSuccess: (bookedDate?: string) => void;
}

// ═══════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════

// ═══════════════════════════════════════════════

import { VisualDatePicker } from '../calendar/VisualDatePicker';

// ═══════════════════════════════════════════════
// Main Form Component
// ═══════════════════════════════════════════════

export default function EnhancedAppointmentForm({
    initialDate = toISODateString(new Date()),
    initialTime = '',
    settings,
    onClose,
    onSuccess
}: EnhancedAppointmentFormProps) {
    const [form, setForm] = useState({
        patientId: '',
        patientName: '',
        patientPhone: '',
        date: initialDate,
        time: initialTime,
        type: 'examination' as AppointmentTypeDTO,
        notes: ''
    });
    const [saving, setSaving] = useState(false);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);

    const timeSlots = useMemo(() => {
        const morning = generateTimeSlots(settings.shifts.morningStart, settings.shifts.morningEnd, settings.slotDuration);
        const evening = generateTimeSlots(settings.shifts.eveningStart, settings.shifts.eveningEnd, settings.slotDuration);
        return [...morning, ...evening];
    }, [settings]);

    useEffect(() => {
        const fetchBookedSlots = async () => {
            const result = await app.appointmentService.getAppointmentsByDate(form.date, 1, 100);
            if (result.success) {
                setBookedSlots(result.data.appointments.map(a => a.time));
            }
        };
        fetchBookedSlots();
    }, [form.date]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.patientName || !form.patientPhone || !form.time) {
            return;
        }
        setSaving(true);
        const result = await app.appointmentService.bookByAdmin({
            ...form,
            patientId: form.patientId || undefined
        });
        if (result.success) {
            onSuccess(form.date);
        } else {
            toast.error(result.error || 'حدث خطأ أثناء حجز الموعد');
        }
        setSaving(false);
    };

    return (
        <form onSubmit={handleSubmit} className="p-0 flex flex-col h-full lg:flex-row lg:gap-8">
            <div className="flex-1 space-y-6">
                {/* Patient Selection */}
                <PatientCombobox
                    value={{ fullName: form.patientName }}
                    onSelect={(p: PatientDTO) => setForm(f => ({ ...f, patientId: p.id, patientName: p.fullName, patientPhone: p.phone }))}
                />

                {!form.patientId && (
                    <div className="animate-in fade-in duration-500">
                        <label htmlFor="patientPhone" className="text-xs font-black text-secondary-900 mb-2 block mr-1 dark:text-white">رقم الهاتف</label>
                        <input
                            id="patientPhone"
                            type="tel"
                            value={form.patientPhone}
                            onChange={(e) => setForm(f => ({ ...f, patientPhone: e.target.value }))}
                            className="w-full bg-secondary-50 border-2 border-secondary-50 rounded-2xl px-5 py-3.5 outline-none focus:border-primary-500 focus:bg-white transition-all font-bold text-secondary-900 text-left dark:bg-secondary-800 dark:border-secondary-700 dark:text-white form-input"
                            placeholder="01xxxxxxxxx"
                            required
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="appointmentType" className="text-xs font-black text-secondary-900 mb-2 block mr-1 dark:text-white">نوع الكشف</label>
                        <select
                            id="appointmentType"
                            value={form.type}
                            onChange={(e) => setForm(f => ({ ...f, type: e.target.value as AppointmentTypeDTO }))}
                            className="w-full bg-secondary-50 border-2 border-secondary-50 rounded-2xl px-5 py-3.5 outline-none focus:border-primary-500 focus:bg-white transition-all font-bold text-secondary-900 appearance-none dark:bg-secondary-800 dark:border-secondary-700 dark:text-white form-input"
                        >
                            {Object.entries(APPOINTMENT_TYPE_MAP).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="appointmentNotes" className="text-xs font-black text-secondary-900 mb-2 block mr-1 dark:text-white">ملاحظات</label>
                        <div className="relative">
                            <input
                                id="appointmentNotes"
                                type="text"
                                value={form.notes}
                                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                                className="w-full bg-secondary-50 border-2 border-secondary-50 rounded-2xl px-5 py-3.5 pr-12 outline-none focus:border-primary-500 focus:bg-white transition-all font-bold text-secondary-900 dark:bg-secondary-800 dark:border-secondary-700 dark:text-white form-input"
                                placeholder="اختياري..."
                            />
                            <MessageCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4 lg:hidden">
                    <button
                        type="submit"
                        disabled={saving || !form.time}
                        className="flex-1 bg-primary-500 text-white py-4 rounded-2xl font-black text-lg hover:bg-primary-600 transition-all shadow-lg shadow-primary-200 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
                        تأكيد الحجز
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-4 bg-secondary-50 text-secondary-500 rounded-2xl font-black hover:bg-secondary-100 transition-all dark:bg-secondary-800 dark:text-secondary-400"
                    >
                        إلغاء
                    </button>
                </div>
            </div>

            <div className="w-full lg:w-80 space-y-6 mt-6 lg:mt-0">
                <VisualDatePicker
                    selectedDate={form.date}
                    onSelect={(date: string) => setForm(f => ({ ...f, date }))}
                />

                <div className="space-y-3">
                    <label className="text-xs font-black text-secondary-900 mb-2 block mr-1 flex items-center gap-2 dark:text-white">
                        <Clock className="w-3 h-3 text-primary-500" />
                        المواعيد المتاحة
                    </label>
                    <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[300px] p-1 custom-scrollbar">
                        {timeSlots.map(time => {
                            const isBooked = bookedSlots.includes(time);
                            const isSelected = form.time === time;
                            return (
                                <button
                                    key={time}
                                    type="button"
                                    disabled={isBooked}
                                    onClick={() => setForm(f => ({ ...f, time }))}
                                    className={`
                                        p-2 rounded-xl text-[10px] font-black transition-all border-2
                                        ${isSelected ? 'bg-primary-500 border-primary-500 text-white shadow-md' : ''}
                                        ${!isSelected && !isBooked ? 'bg-white border-secondary-50 text-secondary-700 hover:border-primary-200 hover:bg-primary-50/50 dark:bg-secondary-900 dark:border-secondary-800 dark:text-secondary-300' : ''}
                                        ${isBooked ? 'bg-secondary-50 border-secondary-50 text-secondary-300 cursor-not-allowed opacity-50 dark:bg-secondary-800 dark:border-secondary-800' : ''}
                                    `}
                                >
                                    {formatTime(time)}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="hidden lg:flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={saving || !form.time}
                        className="flex-1 bg-primary-500 text-white py-4 rounded-2xl font-black text-lg hover:bg-primary-600 transition-all shadow-lg shadow-primary-200 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
                        تأكيد الحجز
                    </button>
                </div>
            </div>
        </form>
    );
}
