import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { app } from '../../application/container';
import { exportDatabase, importDatabase, factoryReset } from '../../application/use-cases/dataManagementUseCase';
import type { ClinicSettingsDTO, ClosureDTO, ClosureReasonDTO } from '../../application/dtos/settings.dto';
import { sanitize } from '../../lib/validation';
import { logger } from '../../utils/logger';
import { useAuditLog } from './useAuditLog';

export const useSettings = () => {
    const [settings, setSettings] = useState<ClinicSettingsDTO | null>(null);
    const [originalSettings, setOriginalSettings] = useState<ClinicSettingsDTO | null>(null);
    const [closures, setClosures] = useState<ClosureDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    
    const { logAudit } = useAuditLog();

    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [settingsResult, closuresResult] = await Promise.all([
                app.settingsService.getSettings(),
                app.settingsService.getClosures()
            ]);

            if (settingsResult.success && settingsResult.data) {
                setSettings(settingsResult.data);
                setOriginalSettings(settingsResult.data);
            } else if (!settingsResult.success) {
                toast.error(settingsResult.error || 'فشل في تحميل الإعدادات');
            }

            if (closuresResult.success && closuresResult.data) {
                setClosures([...closuresResult.data]);
            }
        } catch (error) {
            logger.error('Failed to load settings data', error as Error);
            toast.error('فشل في تحميل بيانات الإعدادات');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        return () => {
            if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
        };
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            const sanitizedSettings = {
                ...settings,
                clinicName: sanitize(settings.clinicName.trim()),
                phone: sanitize(settings.phone?.trim() ?? ''),
                whatsapp: sanitize(settings.whatsapp?.trim() ?? ''),
                address: sanitize(settings.address?.trim() ?? ''),
            };
            const result = await app.settingsService.updateSettings(sanitizedSettings);
            if (!result.success) {
                toast.error(result.error || 'فشل في حفظ الإعدادات');
            } else {
                setOriginalSettings(sanitizedSettings);
                toast.success('تم حفظ الإعدادات بنجاح');
                logAudit('update', 'settings', '1', null, sanitizedSettings, 'Admin updated clinic settings');
            }
        } catch (error) {
            logger.error('Failed to save settings', error as Error);
            toast.error('خطأ غير متوقع في الحفظ');
        } finally {
            setSaving(false);
        }
    };

    const toggleWorkingDay = (day: number) => {
        if (!settings) return;
        const days = settings.workingDays.includes(day)
            ? settings.workingDays.filter((d: number) => d !== day)
            : [...settings.workingDays, day];
        setSettings({ ...settings, workingDays: days });
    };

    const addClosure = async (startDate: string, endDate: string, reason: ClosureReasonDTO) => {
        if (!startDate || !endDate) {
            toast.error('يرجى تحديد تاريخ البداية والنهاية');
            return false;
        }
        const result = await app.settingsService.addClosure({ startDate, endDate, reason });
        if (result.success && result.data) {
            setClosures(prev => [...prev, result.data!]);
            toast.success('تمت إضافة فترة الإغلاق');
            return true;
        } else {
            toast.error(result.error || 'فشل في الإضافة');
            return false;
        }
    };

    const removeClosure = async (id: string) => {
        const result = await app.settingsService.deleteClosure(id);
        if (result.success) {
            setClosures(prev => prev.filter(c => c.id !== id));
            toast.success('تم حذف فترة الإغلاق');
        } else {
            toast.error(result.error || 'فشل في الحذف');
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const json = await exportDatabase();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DCMS_Backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('تم تصدير النسخة الاحتياطية بنجاح');
        } catch (err) {
            logger.error(err);
            toast.error('فشل في تصدير البيانات');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);

        const readFileAsText = (f: File): Promise<string> =>
            new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (ev) => resolve(ev.target?.result as string);
                reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
                reader.readAsText(f);
            });

        try {
            const json = await readFileAsText(file);
            await importDatabase(json);
            toast.success('تم استيراد البيانات بنجاح، يرجى تحديث الصفحة');
            reloadTimerRef.current = setTimeout(() => { window.location.href = '/admin'; }, 2000);
        } catch (err) {
            logger.error(err);
            toast.error(err instanceof Error ? err.message : 'ملف غير صالح أو خطأ في الاستيراد');
        } finally {
            setIsImporting(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleFactoryReset = async (confirmText: string) => {
        if (confirmText !== 'RESET') {
            toast.error('يرجى كتابة كلمة RESET للتأكيد');
            return false;
        }
        setIsResetting(true);
        try {
            await factoryReset();
            toast.success('تمت إعادة ضبط المصنع بنجاح');
            logAudit('delete', 'system', 'all', null, null, 'SUPER_ADMIN executed factory reset');
            reloadTimerRef.current = setTimeout(() => { window.location.href = '/admin'; }, 2000);
            return true;
        } catch (err) {
            logger.error(err);
            toast.error('فشل في إعادة ضبط المصنع');
            return false;
        } finally {
            setIsResetting(false);
        }
    };

    return {
        settings, setSettings, closures, loading, saving,
        isExporting, isImporting, isResetting, hasChanges,
        handleSave, toggleWorkingDay, addClosure, removeClosure,
        handleExport, handleImport, handleFactoryReset, loadData
    };
};
