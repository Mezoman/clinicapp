import { useCallback, useMemo, useEffect, useState } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { app } from '../../application/container';
import type { PatientDTO, PatientsResultDTO } from '../../application/dtos/patient.dto';
import { logger } from '../../utils/logger';

const PATIENTS_QUERY_KEY = 'patients';

export function usePatients(params: { isActive?: boolean | undefined } = {}) {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);

    // تثبيت البارامترات على حسب isActive فقط
    const memoParams = useMemo(() => ({ isActive: params.isActive }), [params.isActive]);

    const fetchPage = useCallback(
        async (p: number): Promise<PatientsResultDTO> => {
            const result = await app.patientService.getPatients({
                isActive: memoParams.isActive,
                page: p,
                pageSize: 10 // تقليل حجم الصفحة لتحسين الأداء
            });
            if (result.success && result.data) return result.data;
            throw new Error(result.error || 'فشل في تحميل القائمة');
        },
        [memoParams.isActive]
    );

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useQuery<PatientsResultDTO, Error>({
        queryKey: [PATIENTS_QUERY_KEY, memoParams.isActive, page],
        queryFn: () => fetchPage(page),
        placeholderData: keepPreviousData,
        staleTime: 60 * 1000,
    });

    useEffect(() => {
        if (isError && error) {
            logger.error('Patients Load Error:', error);
        }
    }, [isError, error]);

    const patients: readonly PatientDTO[] = data?.patients ?? [];
    const hasMore = data?.hasMore ?? false;
    const totalPages = data?.totalPages || 1;
    const totalCount = data?.totalCount || 0;

    const search = useCallback(
        async (term: string) => {
            setPage(1);
            if (!term.trim()) {
                await refetch();
                return;
            }
            try {
                const result = await app.patientService.getPatients({
                    search: term,
                    isActive: memoParams.isActive,
                    page: 1,
                    pageSize: 10
                });

                if (!result.success || !result.data) throw new Error(result.error);

                queryClient.setQueryData<PatientsResultDTO>(
                    [PATIENTS_QUERY_KEY, memoParams.isActive, 1],
                    result.data
                );
            } catch (err) {
                logger.error('Search Patients Error:', err);
            }
        },
        [memoParams.isActive, queryClient, refetch]
    );

    const refresh = useCallback(async () => {
        setPage(1);
        await refetch();
    }, [refetch]);

    return {
        patients,
        loading: isLoading || isFetching,
        error: isError ? (error?.message ?? 'فشل في تحميل قائمة المرضى') : null,
        hasMore,
        search,
        refresh,
        page,
        setPage,
        totalPages,
        totalCount
    };
}
