import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { app } from '../../application/container';
import { type LandingContentDTO } from '../../application/services/CmsService';
export type { LandingContentDTO };
import { logger } from '../../utils/logger';

export const useCMSContent = () => {
    const queryClient = useQueryClient();

    // Use React Query for loading data
    const { 
        data: cmsMap = {}, 
        isLoading: loading, 
        refetch: load 
    } = useQuery({
        queryKey: ['cms', 'landing', 'raw'],
        queryFn: async () => {
            const result = await app.cmsService.getLandingContent();
            if (!result.success) {
                toast.error(result.error || 'فشل في تحميل محتوى الموقع');
                throw new Error(result.error);
            }
            
            const map: Record<string, LandingContentDTO> = {};
            result.data.forEach((item) => {
                map[item.key] = item;
            });
            return map;
        },
        staleTime: 1000 * 60 * 10, // 10 minutes cache
        gcTime: 1000 * 60 * 30,    // 30 minutes garbage collection
    });

    // Use React Query for mutations
    const saveMutation = useMutation({
        mutationFn: async ({ id, value }: { id: string; value: string }) => {
            const result = await app.cmsService.updateContent(id, value);
            if (!result.success) throw new Error(result.error || 'فشل في حفظ التغييرات');
            return result;
        },
        onSuccess: (_, variables) => {
            // Optimistic or manual cache update
            queryClient.setQueryData(['cms', 'landing', 'raw'], (old: Record<string, LandingContentDTO> | undefined) => {
                if (!old) return old;
                const newMap = { ...old };
                const item = Object.values(newMap).find(c => c.id === variables.id);
                if (item) {
                    newMap[item.key] = { ...item, content: variables.value };
                }
                return newMap;
            });
            
            // Invalidate both raw and structured data caches
            queryClient.invalidateQueries({ queryKey: ['cms', 'landing', 'raw'] });
            queryClient.invalidateQueries({ queryKey: ['cms', 'landing', 'page'] });
            
            toast.success('تم حفظ التغييرات بنجاح');
        },
        onError: (error) => {
            logger.error('Failed to save CMS content', { error });
            toast.error(error instanceof Error ? error.message : 'فشل في حفظ التغييرات');
        }
    });

    const handleSave = async (id: string, value: string) => {
        return saveMutation.mutateAsync({ id, value });
    };

    return { 
        loading, 
        cmsMap, 
        handleSave, 
        load: async () => { await load(); } 
    };
};
