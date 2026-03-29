import { useState, useMemo } from 'react';
import {
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isBefore,
    startOfToday,
    parseISO
} from 'date-fns';
import { toISODateString } from '../../../utils/dateUtils';

interface VisualDatePickerProps {
    selectedDate: string;
    onSelect: (date: string) => void;
    disabledDates?: string[];
}

export const VisualDatePicker = ({ selectedDate, onSelect, disabledDates = [] }: VisualDatePickerProps) => {
    const [currentMonth, setCurrentMonth] = useState(parseISO(selectedDate || toISODateString(new Date())));

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 6 });
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 6 });
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const weekDays = ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];

    return (
        <div className="p-4 bg-white rounded-3xl border border-secondary-100 shadow-sm dark:bg-secondary-900 dark:border-secondary-800">
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-black text-secondary-900 dark:text-white">
                    {currentMonth.toLocaleString('ar-EG', { month: 'long', year: 'numeric' })}
                </h4>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-3 hover:bg-secondary-50 rounded-xl dark:hover:bg-secondary-800 min-h-[44px] flex items-center justify-center border border-secondary-100 dark:border-secondary-800"
                        aria-label="الشهر السابق"
                    >
                        <ChevronRight className="w-5 h-5 text-secondary-900 dark:text-white" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-3 hover:bg-secondary-50 rounded-xl dark:hover:bg-secondary-800 min-h-[44px] flex items-center justify-center border border-secondary-100 dark:border-secondary-800"
                        aria-label="الشهر التالي"
                    >
                        <ChevronLeft className="w-5 h-5 text-secondary-900 dark:text-white" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(d => (
                    <div key={d} className="text-[10px] sm:text-xs font-black text-secondary-400 text-center py-2">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
                {days.map((day) => {
                    const dateStr = toISODateString(day);
                    const isSelected = selectedDate === dateStr;
                    const isTodayVal = isSameDay(day, startOfToday());
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isPast = isBefore(day, startOfToday()) && !isTodayVal;
                    const isDisabled = disabledDates.includes(dateStr);

                    return (
                        <button
                            key={dateStr}
                            type="button"
                            disabled={isPast || isDisabled}
                            onClick={() => onSelect(dateStr)}
                            className={`
                                aspect-square rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center transition-all min-h-[40px] md:min-h-[44px]
                                ${isSelected ? 'bg-primary-500 text-white shadow-lg shadow-primary-200' : ''}
                                ${!isSelected && isTodayVal ? 'border-2 border-primary-200 text-primary-600' : ''}
                                ${!isSelected && !isTodayVal && isCurrentMonth ? 'hover:bg-secondary-50 text-secondary-900 dark:text-white dark:hover:bg-secondary-800' : ''}
                                ${!isCurrentMonth ? 'text-secondary-300 dark:text-secondary-700' : ''}
                                ${isPast || isDisabled ? 'opacity-20 cursor-not-allowed' : ''}
                            `}
                        >
                            {day.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
