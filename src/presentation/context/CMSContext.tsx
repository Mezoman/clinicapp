import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { app } from '../../application/container';
import { LandingPageDTO } from '../../application/services/CmsService';
import { logger } from '../../utils/logger';

interface CMSContextType {
    data: LandingPageDTO | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

const CMSContext = createContext<CMSContextType | null>(null);

export function CMSProvider({ children }: { children: ReactNode }) {
    // const queryClient = useQueryClient(); // Unused here, moved logic to useCMSContent

    // Use React Query for content loading
    // Set staleTime to avoid duplicate requests when moving between pages
    const { 
        data: cmsData = null, 
        isLoading: loading, 
        isError,
        error: queryError,
        refetch
    } = useQuery({
        queryKey: ['cms', 'landing', 'page'],
        queryFn: async () => {
            const result = await app.cmsService.getLandingPageContent();
            if (!result.success) {
                logger.error('Failed to load CMS data', { error: result.error });
                throw new Error(result.error);
            }
            
            // High-Performance Theme Injection
            const { theme } = result.data;
            const root = document.documentElement;
            // Batch style updates
            requestAnimationFrame(() => {
                root.style.setProperty('--color-primary-500', theme.primary);
                root.style.setProperty('--color-secondary-900', theme.secondary);
                root.style.setProperty('--color-accent-500', theme.accent);
                root.style.setProperty('--gradient-primary-start', theme.primary);
            });

            return result.data;
        },
        staleTime: 1000 * 60 * 15, // 15 minutes fresh
        gcTime: 1000 * 60 * 60,    // 1 hour in cache
    });

    const value = useMemo(() => ({
        data: cmsData,
        loading,
        error: isError ? (queryError as Error).message : null,
        refresh: async () => { await refetch(); }
    }), [cmsData, loading, isError, queryError, refetch]);

    return (
        <CMSContext.Provider value={value}>
            {children}
        </CMSContext.Provider>
    );
}

export function useCMS() {
    const context = useContext(CMSContext);
    if (!context) {
        throw new Error('useCMS must be used within a CMSProvider');
    }
    return context;
}
