import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale/ar';

// ═══════════════════════════════════════════════
// Date Utilities
// ═══════════════════════════════════════════════

export function formatDate(dateStr: string): string {
    const date = parseISO(dateStr);
    return format(date, 'EEEE، d MMMM yyyy', { locale: ar });
}

export function formatDateShort(dateStr: string): string {
    const date = parseISO(dateStr);
    return format(date, 'dd/MM/yyyy', { locale: ar });
}

export function formatDayName(dateStr: string): string {
    const date = parseISO(dateStr);
    return format(date, 'EEEE', { locale: ar });
}


export function formatTime(time: string | null): string {
    if (!time) return '--:--';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours ?? '0', 10);
    const m = minutes ?? '00';
    const period = h >= 12 ? 'مساءً' : 'صباحاً';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${m} ${period}`;
}

export function toISODateString(date: Date): string {
    return format(date, 'yyyy-MM-dd');
}

export function generateTimeSlots(
    startTime: string,
    endTime: string,
    durationMinutes: number
): string[] {
    const slots: string[] = [];
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    if (startH === undefined || startM === undefined || endH === undefined || endM === undefined) {
        return slots;
    }

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + durationMinutes <= endMinutes) {
        const h = Math.floor(currentMinutes / 60);
        const m = currentMinutes % 60;
        slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        currentMinutes += durationMinutes;
    }

    return slots;
}

