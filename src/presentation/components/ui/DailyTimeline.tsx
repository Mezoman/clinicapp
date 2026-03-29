import React from 'react';
import { Plus } from 'lucide-react';
import { Badge } from './Badge';
import { formatTime } from '../../../utils/dateUtils';

interface Appointment {
    id: string | number;
    patientName: string;
    time: string;
    status: string;
    type: string;
}

interface DailyTimelineProps {
    appointments: Appointment[];
    loading?: boolean;
    onAddAppointment?: () => void;
}

export const DailyTimeline: React.FC<DailyTimelineProps> = ({
    appointments,
    loading = false,
    onAddAppointment
}) => {
    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                        <div className="w-16 h-4 bg-gray-100 dark:bg-slate-700 rounded" />
                        <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-slate-700" />
                        <div className="flex-1 h-12 bg-gray-50 dark:bg-slate-800/50 rounded-xl" />
                    </div>
                ))}
            </div>
        );
    }

    const sortedAppointments = [...appointments].sort((a, b) => a.time.localeCompare(b.time));

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-500';
            case 'confirmed': return 'bg-blue-500';
            case 'cancelled': return 'bg-red-500';
            case 'missed': return 'bg-gray-400';
            default: return 'bg-amber-500';
        }
    };

    return (
        <div className="relative space-y-1" dir="rtl">
            {/* Vertical Line */}
            <div className="absolute top-0 bottom-0 right-[4.25rem] w-px bg-gray-100 dark:bg-slate-700" />

            {sortedAppointments.length === 0 ? (
                <div className="py-12 text-center">
                    <p className="text-gray-400 dark:text-slate-500 text-sm font-medium">لا توجد مواعيد مضافة لليوم</p>
                    <button
                        onClick={onAddAppointment}
                        className="mt-4 text-primary-600 dark:text-primary-400 text-xs font-bold hover:underline inline-flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" />
                        إضافة أول موعد
                    </button>
                </div>
            ) : (
                sortedAppointments.map((apt) => (
                    <div key={apt.id} className="group relative flex items-center gap-6 py-3 px-2 rounded-2xl transition-all hover:bg-gray-50/50 dark:hover:bg-slate-800/30">
                        {/* Time Label */}
                        <div className="w-14 text-left">
                            <span className="text-xs font-bold text-gray-500 dark:text-slate-400">
                                {formatTime(apt.time)}
                            </span>
                        </div>

                        {/* Dot */}
                        <div className={`
                            relative z-10 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm
                            ${getStatusColor(apt.status)}
                            ${apt.status === 'pending' ? 'animate-pulse' : ''}
                        `} />

                        {/* Content Card */}
                        <div className="flex-1 flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-sm group-hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{apt.patientName}</span>
                                    <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500">{apt.type}</span>
                                </div>
                            </div>

                            <Badge variant={apt.status as any} showIcon={false} className="text-[10px]" />
                        </div>
                    </div>
                ))
            )}

            {/* Available Slot Placeholder */}
            <div className="group relative flex items-center gap-6 py-3 px-2 rounded-2xl border border-dashed border-gray-100 dark:border-slate-700/50 mt-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer" onClick={onAddAppointment}>
                <div className="w-14 text-left">
                    <span className="text-xs font-medium text-gray-300 dark:text-slate-600">--:--</span>
                </div>
                <div className="relative z-10 w-2 h-2 rounded-full bg-gray-200 dark:bg-slate-700" />
                <div className="flex-1 p-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300 dark:text-slate-500">[ متاح ]</span>
                    <Plus className="w-4 h-4 text-gray-300 dark:text-slate-600" />
                </div>
            </div>
        </div>
    );
};
