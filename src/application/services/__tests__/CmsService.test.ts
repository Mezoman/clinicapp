// src/application/services/__tests__/CmsService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CmsService, DEFAULT_SERVICES } from '../CmsService';
import { getLandingContent, updateContent } from '../../../infrastructure/repositories/cmsRepository';

vi.mock('../../../infrastructure/repositories/cmsRepository', () => ({
    getLandingContent: vi.fn(),
    updateContent: vi.fn(),
}));

vi.mock('../../../utils/logger', () => ({
    logger: { error: vi.fn() }
}));

describe('CmsService', () => {
    let service: CmsService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new CmsService();
    });

    it('getLandingContent() يجب أن ينادي الـ repo ويُرجح النجاح', async () => {
        const mockData = [{ id: '1', key: 'k', content: 'c', section: 's', type: 'text' }];
        vi.mocked(getLandingContent).mockResolvedValue(mockData as any);
        const result = await service.getLandingContent();
        expect(result.success).toBe(true);
        if (result.success) expect(result.data).toEqual(mockData);
    });

    it('getLandingContent() يجب أن يمسك الخطأ', async () => {
        vi.mocked(getLandingContent).mockRejectedValue(new Error('fail'));
        const result = await service.getLandingContent();
        expect(result.success).toBe(false);
    });

    it('updateContent() يجب أن ينادي الـ repo', async () => {
        vi.mocked(updateContent).mockResolvedValue(undefined);
        const result = await service.updateContent('1', 'new val');
        expect(result.success).toBe(true);
        expect(updateContent).toHaveBeenCalledWith('1', 'new val');
    });

    it('updateContent() يجب أن يمسك الخطأ', async () => {
        vi.mocked(updateContent).mockRejectedValue(new Error('fail'));
        const result = await service.updateContent('1', 'x');
        expect(result.success).toBe(false);
    });

    describe('getLandingPageContent() - Mapping Logic', () => {
        it('يجب أن يستخدم DEFAULT_SERVICES إذا كان الـ DB فارغاً', async () => {
            vi.mocked(getLandingContent).mockResolvedValue([]);
            const result = await service.getLandingPageContent();
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.services.list).toEqual(DEFAULT_SERVICES);
            }
        });

        it('يجب أن يحول JSON الخدمات بشكل صحيح', async () => {
            vi.mocked(getLandingContent).mockResolvedValue([
                { id: '1', key: 'services_list', section: 'services', type: 'json', content: JSON.stringify([{ title: 'S1', visible: true }]) }
            ] as any);
            const result = await service.getLandingPageContent();
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.services.list[0]?.title).toBe('S1');
            }
        });

        it('يجب أن يتعامل مع JSON غير صالح (Parsing Error)', async () => {
            vi.mocked(getLandingContent).mockResolvedValue([
                { id: '1', key: 'services_list', section: 'services', type: 'json', content: '{invalid: json}' }
            ] as any);
            const result = await service.getLandingPageContent();
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.services.list).toEqual(DEFAULT_SERVICES);
            }
        });

        it('يجب أن يدعم النظام القديم (Mapping by section+key)', async () => {
            vi.mocked(getLandingContent).mockResolvedValue([
                { id: '1', key: 'title', section: 'hero', type: 'text', content: 'Hero Title' }
            ] as any);
            const result = await service.getLandingPageContent();
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.hero.title).toBe('Hero Title');
            }
        });

        it('يجب أن يمسك الأخطاء الكلية (Catch all)', async () => {
            vi.mocked(getLandingContent).mockRejectedValue(new Error('fatal'));
            const result = await service.getLandingPageContent();
            expect(result.success).toBe(false);
        });

        it('يجب أن يعالج credentials و whyus بشكل كامل', async () => {
            vi.mocked(getLandingContent).mockResolvedValue([
                { id: 'c', key: 'credentials_list', section: 'creds', type: 'json', content: JSON.stringify([{ title: 'Dr.' }]) },
                { id: 'w', key: 'whyus_items', section: 'why', type: 'json', content: JSON.stringify([{ title: 'Reliable', desc: 'Very' }]) }
            ] as any);
            const result = await service.getLandingPageContent();
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.credentials.list[0]?.title).toBe('Dr.');
                expect(result.data.whyus.items?.[0]?.description).toBe('Very');
            }
        });
    });
});
