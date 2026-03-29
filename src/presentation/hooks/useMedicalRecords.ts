import { useQuery } from '@tanstack/react-query';
import { app } from '../../application/container';
import type { MedicalRecordDTO } from '../../application/dtos/medical.dto';

export const MEDICAL_RECORDS_QUERY_KEY = 'medical-records';

export function useMedicalRecords(patientId: string | null) {
    return useQuery<readonly MedicalRecordDTO[], Error>({
        queryKey: [MEDICAL_RECORDS_QUERY_KEY, patientId],
        queryFn: async () => {
            if (!patientId) return [];
            const result = await app.medicalRecordService.getByPatientId(patientId);
            if (!result.success || !result.data) {
                throw new Error(result.error || 'فشل في تحميل السجلات الطبية');
            }
            return result.data;
        },
        enabled: !!patientId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
