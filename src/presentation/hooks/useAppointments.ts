import { useCallback, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { app } from '../../application/container';
import { toISODateString } from '../../utils/dateUtils';
import type { AppointmentDTO, AppointmentsResultDTO } from '../../application/dtos/appointment.dto';
import { logger } from '../../utils/logger';

const APPOINTMENTS_QUERY_KEY = 'appointments';

export function useAppointments(date?: string, enabled: boolean = true) {
    const selectedDate = date || toISODateString(new Date());

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useQuery<AppointmentsResultDTO, Error>({
        queryKey: [APPOINTMENTS_QUERY_KEY, selectedDate],
        queryFn: async () => {
            const result = await app.appointmentService.getAppointmentsByDate(selectedDate);
            if (!result.success || !result.data) throw new Error(result.error);
            return result.data;
        },
        staleTime: 60 * 1000,
        enabled,
    });

    useEffect(() => {
        if (isError && error) {
            logger.error('Appointments Load Error:', error);
        }
    }, [isError, error]);

    const appointments: readonly AppointmentDTO[] = data?.appointments ?? [];

    const refresh = useCallback(async () => {
        await refetch();
    }, [refetch]);

    return {
        appointments,
        loading: isLoading || isFetching,
        error: isError ? (error?.message ?? 'فشل في تحميل المواعيد') : null,
        refresh,
    };
}

export function useTodayAppointments() {
    const [appointments, setAppointments] = useState<readonly AppointmentDTO[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const today = toISODateString(new Date());
        const unsubscribe = app.appointmentService.subscribeByDate(today, (data) => {
            setAppointments(data);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    return { appointments, loading };
}
