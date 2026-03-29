import React, { useMemo, useCallback } from 'react';
import {
    Clock,
    Plus,
    MoreVertical
} from 'lucide-react';
import { AppointmentDTO, AppointmentStatusDTO } from '../../../application/dtos/appointment.dto';
import { ClinicSettingsDTO } from '../../../application/dtos/settings.dto';
import { APPOINTMENT_STATUS_MAP, APPOINTMENT_TYPE_MAP } from '../../../constants';
import { formatTime, generateTimeSlots, toISODateString, formatDayName, formatDateShort } from '../../../utils/dateUtils';
import { startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

interface AppointmentsCalendarGridProps {
    readonly view: 'day' | 'week';
    readonly selectedDate: string;
    readonly appointments: readonly AppointmentDTO[];
    readonly settings: ClinicSettingsDTO;
    readonly onAddAppointment: (date: string, time: string) => void;
    readonly onSelectAppointment: (appointment: AppointmentDTO) => void;
    readonly onUpdateStatus: (id: string, status: AppointmentStatusDTO) => void;
    readonly onDelete: (id: string) => void;
}

// ═══════════════════════════════════════════════
// Sub-components (Memoized)
// ═══════════════════════════════════════════════

const AppointmentBlock = React.memo(({
    appointment,
    onClick
}: {
    readonly appointment: AppointmentDTO;
    readonly onClick: (appointment: AppointmentDTO) => void;
}) => {
    const status = APPOINTMENT_STATUS_MAP[appointment.status as keyof typeof APPOINTMENT_STATUS_MAP];

    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onClick(appointment);
            }}
            aria-label={`موعد: ${appointment.patientName}، الوقت: ${formatTime(appointment.time)}، الحالة: ${status?.label || appointment.status}`}
            className={`
                group relative flex flex-col p-2 rounded-xl border-l-[3px] transition-all cursor-pointer h-full w-full text-right outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                ${status?.bgColor || 'bg-[var(--bg-page)]'} ${status?.color || 'text-[var(--text-secondary)]'}
                border-l-current shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-95
            `}
        >
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black uppercase tracking-wider opacity-90 font-numbers text-[var(--text-primary)]">
                    {formatTime(appointment.time)}
                </span>
                <div className="p-1 rounded-md bg-white/70 dark:bg-black/40 transition-opacity">
                    <MoreVertical className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
            </div>
            <p className="text-xs font-black truncate leading-tight mb-1">{appointment.patientName}</p>
            <div className="flex items-center gap-1 mt-auto">
                <span className="text-[10px] sm:text-xs font-bold opacity-90 bg-white/60 dark:bg-black/40 px-2 py-0.5 rounded-md">
                    {APPOINTMENT_TYPE_MAP[appointment.type as keyof typeof APPOINTMENT_TYPE_MAP] || appointment.type}
                </span>
            </div>
        </button>
    );
});

const EmptySlot = React.memo(({
    time,
    date,
    onAdd
}: {
    readonly time: string;
    readonly date: string;
    readonly onAdd: (date: string, time: string) => void;
}) => {
    return (
        <button
            onClick={() => onAdd(date, time)}
            aria-label={`إضافة موعد في ${formatTime(time)}`}
            className="w-full h-full min-h-[60px] border-b border-[var(--border-subtle)]/30 border-dashed hover:bg-primary/5 transition-colors flex items-center justify-center group outline-none focus-visible:bg-primary/10"
        >
            <Plus className="w-4 h-4 text-[var(--text-secondary)]/30 group-hover:text-primary group-hover:scale-125 transition-all" aria-hidden="true" />
        </button>
    );
});

// ═══════════════════════════════════════════════
// Daily Grid
// ═══════════════════════════════════════════════

interface GridProps {
    readonly selectedDate: string;
    readonly appointments: readonly AppointmentDTO[];
    readonly settings: ClinicSettingsDTO;
    readonly onAdd: (date: string, time: string) => void;
    readonly onSelect: (appointment: AppointmentDTO) => void;
}

const DailyGrid = ({
    selectedDate,
    appointments,
    settings,
    onAdd,
    onSelect
}: GridProps) => {
    const timeSlots = useMemo(() => {
        const morning = generateTimeSlots(settings.shifts.morningStart, settings.shifts.morningEnd, settings.slotDuration);
        const evening = generateTimeSlots(settings.shifts.eveningStart, settings.shifts.eveningEnd, settings.slotDuration);
        return [...morning, ...evening];
    }, [settings]);

    const handleAdd = useCallback((d: string, t: string) => onAdd(d, t), [onAdd]);
    const handleSelect = useCallback((apt: AppointmentDTO) => onSelect(apt), [onSelect]);

    return (
        <div className="bg-[var(--bg-card)] rounded-[2rem] border-[1.5px] border-[var(--border-color)] overflow-hidden shadow-sm">
            <header className="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-page)]/30 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                    <Clock className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-[var(--text-primary)]">جدول اليوم</h3>
                    <p className="text-xs font-bold text-[var(--text-secondary)]">{formatDayName(selectedDate)} — {(new Date(selectedDate)).toLocaleDateString('ar-EG')}</p>
                </div>
            </header>

            <ul className="divide-y divide-[var(--border-subtle)]/50" aria-label="فترات المواعيد اليومية">
                {timeSlots.map((time) => {
                    const apt = appointments.find((a: AppointmentDTO) => a.time?.substring(0, 5) === time);
                    return (
                        <li key={time} className="flex items-stretch group min-h-[100px]">
                            <div className="w-24 p-5 border-r border-[var(--border-subtle)]/50 flex flex-col justify-center bg-[var(--bg-page)]/10">
                                <span className="text-sm font-black text-[var(--text-primary)] font-numbers">{formatTime(time)}</span>
                                <span className="text-xs font-bold text-[var(--text-secondary)] opacity-70 font-numbers">{time}</span>
                            </div>
                            <div className="flex-1 p-2.5 relative">
                                {apt ? (
                                    <AppointmentBlock appointment={apt} onClick={handleSelect} />
                                ) : (
                                    <EmptySlot time={time} date={selectedDate} onAdd={handleAdd} />
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

// ═══════════════════════════════════════════════
// Weekly Grid
// ═══════════════════════════════════════════════

const WeeklyGrid = ({
    selectedDate,
    appointments,
    settings,
    onAdd,
    onSelect
}: GridProps) => {
    const weekStart = useMemo(() => startOfWeek(parseISO(selectedDate), { weekStartsOn: 6 }), [selectedDate]); // Sat
    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => toISODateString(addDays(weekStart, i))), [weekStart]);

    const timeSlots = useMemo(() => {
        const morning = generateTimeSlots(settings.shifts.morningStart, settings.shifts.morningEnd, settings.slotDuration);
        const evening = generateTimeSlots(settings.shifts.eveningStart, settings.shifts.eveningEnd, settings.slotDuration);
        return [...morning, ...evening];
    }, [settings]);

    const handleAdd = useCallback((d: string, t: string) => onAdd(d, t), [onAdd]);
    const handleSelect = useCallback((apt: AppointmentDTO) => onSelect(apt), [onSelect]);

    return (
        <div className="bg-[var(--bg-card)] rounded-[2rem] border-[1.5px] border-[var(--border-color)] overflow-hidden shadow-sm flex flex-col">
            <section className="overflow-x-auto custom-scrollbar" aria-label="جدول المواعيد الأسبوعي">
                <div className="min-w-[1050px]">
                    {/* Header */}
                    <div className="flex items-stretch border-b border-[var(--border-subtle)]">
                        <div className="w-24 border-r border-[var(--border-subtle)] bg-[var(--bg-page)]/50" />
                        {weekDays.map((day) => {
                            const isCurrent = isSameDay(parseISO(day), parseISO(selectedDate));
                            return (
                                <div
                                    key={day}
                                    className={`flex-1 p-5 text-center border-r border-[var(--border-subtle)]/50 last:border-r-0 ${isCurrent ? 'bg-primary/5 ring-1 ring-inset ring-primary/10' : ''}`}
                                >
                                    <p className={`text-xs font-black uppercase tracking-widest mb-1 ${isCurrent ? 'text-primary' : 'text-[var(--text-secondary)]'}`}>
                                        {formatDayName(day)}
                                    </p>
                                    <p className={`text-base font-black font-numbers ${isCurrent ? 'text-primary' : 'text-[var(--text-primary)]'}`}>
                                        {formatDateShort(day)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Grid */}
                    <div className="flex items-start">
                        {/* Time labels column */}
                        <div className="w-24 flex-shrink-0" aria-hidden="true">
                            {timeSlots.map((time) => (
                                <div key={time} className="h-[120px] border-b border-[var(--border-subtle)]/50 flex flex-col items-center justify-center bg-[var(--bg-page)]/5">
                                    <span className="text-sm font-black text-[var(--text-primary)] font-numbers">{formatTime(time)}</span>
                                    <span className="text-xs font-bold text-[var(--text-secondary)] opacity-70 font-numbers">{time}</span>
                                </div>
                            ))}
                        </div>

                        {/* Days columns */}
                        {weekDays.map((day) => (
                            <section key={day} className="flex-1 flex flex-col border-r border-[var(--border-subtle)]/50 last:border-r-0" aria-label={formatDayName(day)}>
                                {timeSlots.map((time) => {
                                    const apt = appointments.find((a: AppointmentDTO) => a.date === day && a.time?.substring(0, 5) === time);
                                    return (
                                        <div key={`${day}-${time}`} className="h-[120px] p-2 border-b border-[var(--border-subtle)]/50 relative">
                                            {apt ? (
                                                <AppointmentBlock appointment={apt} onClick={handleSelect} />
                                            ) : (
                                                <EmptySlot time={time} date={day} onAdd={handleAdd} />
                                            )}
                                        </div>
                                    );
                                })}
                            </section>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

// ═══════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════

export default function AppointmentsCalendarGrid(props: AppointmentsCalendarGridProps) {
    if (props.view === 'day') {
        return <DailyGrid {...props} onAdd={props.onAddAppointment} onSelect={props.onSelectAppointment} />;
    }
    return <WeeklyGrid {...props} onAdd={props.onAddAppointment} onSelect={props.onSelectAppointment} />;
}
