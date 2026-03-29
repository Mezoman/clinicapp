import { useState, useRef } from 'react';
import {
    Save,
    Loader2,
    Clock,
    AlertTriangle,
    Building,
    BellRing,
    Database,
    ShieldCheck,
    Activity,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useIsSuperAdmin } from '../../hooks/useAuth';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useSettings } from '../../hooks/useSettings';
import { TabType, ClosureFormState } from '../../components/settings/types';
import {
    ClinicInfoTab,
    WorkHoursTab,
    NotificationsTab,
    BackupTab,
    UsersTab,
    ServicesTab
} from '../../components/settings/tabs';
import {
    ClosureModal,
    ResetModal
} from '../../components/settings/modals';

// CQ-05 FIX: LucideIcon instead of any
const TABS: { id: TabType; label: string; icon: LucideIcon }[] = [
    { id: 'clinic', label: 'معلومات العيادة', icon: Building },
    { id: 'hours', label: 'ساعات العمل', icon: Clock },
    { id: 'notifications', label: 'الإشعارات والتنبيهات', icon: BellRing },
    { id: 'backup', label: 'النسخ الاحتياطي', icon: Database },
    { id: 'users', label: 'إدارة المستخدمين', icon: ShieldCheck },
    { id: 'services', label: 'الخدمات والأسعار', icon: Activity },
];

export default function Settings() {
    // 1. Hook and Global State
    const {
        settings, setSettings, closures, loading, saving,
        isExporting, isImporting, isResetting, hasChanges,
        handleSave, toggleWorkingDay, addClosure, removeClosure,
        handleExport, handleImport, handleFactoryReset
    } = useSettings();
    
    const isSuperAdmin = useIsSuperAdmin();

    // 2. UI-only State
    const [activeTab, setActiveTab] = useState<TabType>('clinic');
    const [showClosureModal, setShowClosureModal] = useState(false);
    const [closureForm, setClosureForm] = useState<ClosureFormState>({ startDate: '', endDate: '', reason: 'holiday' });
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetConfirmText, setResetConfirmText] = useState('');

    // 3. Refs and Focus Traps
    const closureModalRef = useRef<HTMLDivElement>(null);
    const resetModalRef = useRef<HTMLDivElement>(null);

    useFocusTrap(closureModalRef, showClosureModal, () => setShowClosureModal(false));
    useFocusTrap(resetModalRef, showResetModal, () => setShowResetModal(false));

    // 4. Action Handlers
    const onAddClosure = async () => {
        const success = await addClosure(closureForm.startDate, closureForm.endDate, closureForm.reason);
        if (success) setShowClosureModal(false);
    };

    const onFactoryReset = async () => {
        const success = await handleFactoryReset(resetConfirmText);
        if (success) setShowResetModal(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto p-4 md:p-8 w-full animate-pulse">
                <aside className="w-full lg:w-72 shrink-0">
                    <div className="bg-[var(--bg-card)] rounded-[2.5rem] border-[1.5px] border-[var(--border-color)] p-4 space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={`skel-nav-${i}`} className="h-14 bg-[var(--bg-page)] rounded-[1.5rem] w-full" />
                        ))}
                    </div>
                </aside>
                <div className="flex-1 flex flex-col max-w-4xl space-y-8">
                    <div className="bg-[var(--bg-card)] rounded-[2.5rem] border-[1.5px] border-[var(--border-color)] p-8 min-h-[400px]">
                        <div className="h-8 w-48 bg-[var(--bg-page)] rounded-lg mb-10" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="h-14 bg-[var(--bg-page)] rounded-2xl w-full" />
                            <div className="h-14 bg-[var(--bg-page)] rounded-2xl w-full" />
                            <div className="h-14 bg-[var(--bg-page)] rounded-2xl w-full md:col-span-2" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!settings) return null;

    // Tabs that have no saveable data — hide the save bar for them
    const tabHasSaveAction = activeTab === 'clinic' || activeTab === 'hours';

    return (
        <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-72 shrink-0">
                <div className="bg-[var(--bg-card)] rounded-[2.5rem] border-[1.5px] border-[var(--border-color)] shadow-sm p-4 sticky top-24">
                    <div role="tablist" aria-label="أقسام الإعدادات" className="flex flex-col gap-2">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                className={`flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all group ${
                                    activeTab === tab.id 
                                        ? 'bg-primary text-white shadow-xl shadow-primary/20 translate-y-[-2px]' 
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-[var(--bg-page)]/50'
                                }`}
                            >
                                <tab.icon aria-hidden={true} className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover:text-primary'} transition-colors`} />
                                <span className="text-sm font-black">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col max-w-4xl">

                {/* Unsaved changes banner */}
                {hasChanges && tabHasSaveAction && (
                    <div className="mb-6 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-[1.5rem] p-5 flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-4 text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-widest font-inter">لديك تغييرات غير محفوظة حالياً</span>
                        </div>
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-amber-500 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-[0.1em] hover:bg-amber-600 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
                        >
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" role="status" aria-label="جاري الحفظ" /> : <Save className="w-3 h-3" />}
                            حفظ الآن
                        </button>
                    </div>
                )}

                {/* Tab content */}
                <div className="flex-1 space-y-8">
                    {activeTab === 'clinic' && <ClinicInfoTab settings={settings} setSettings={setSettings} onSave={handleSave} saving={saving} />}
                    {activeTab === 'hours' && (
                        <WorkHoursTab 
                            settings={settings} 
                            setSettings={setSettings} 
                            closures={closures} 
                            onAddClosure={() => setShowClosureModal(true)} 
                            onRemoveClosure={removeClosure} 
                            toggleWorkingDay={toggleWorkingDay}
                            onSave={handleSave}
                            saving={saving}
                        />
                    )}
                    {activeTab === 'notifications' && <NotificationsTab />}
                    {activeTab === 'backup' && (
                        <BackupTab 
                            isSuperAdmin={isSuperAdmin} 
                            isExporting={isExporting} 
                            isImporting={isImporting} 
                            isResetting={isResetting} 
                            onExport={handleExport} 
                            onImport={handleImport} 
                            onShowReset={() => setShowResetModal(true)} 
                        />
                    )}
                    {activeTab === 'users' && <UsersTab isSuperAdmin={isSuperAdmin} />}
                    {activeTab === 'services' && <ServicesTab />}
                </div>

                {/* Bottom Save Bar — inline (not fixed), only for tabs with saveable data */}
                {tabHasSaveAction && (
                    <div className="mt-8 bg-[var(--bg-card)] border-[1.5px] border-[var(--border-color)] rounded-[2rem] p-6 px-8 flex justify-between items-center shadow-sm">
                        <div className="hidden md:flex flex-col gap-1">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">الحالة الحالية</p>
                            <p className="text-xs font-black text-primary uppercase tracking-widest">
                                {activeTab === 'clinic' ? 'تعديل الملف الشخصي' : 'تعديل أوقات العمل'}
                            </p>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 md:flex-initial flex items-center justify-center gap-4 bg-primary text-white rounded-2xl px-12 sm:px-16 py-4 font-black shadow-2xl shadow-primary/30 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" role="status" aria-label="جاري الحفظ" /> : <Save className="w-5 h-5" />}
                                <span className="uppercase tracking-[0.2em] text-xs">حفظ كافة التغييرات</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <ClosureModal 
                isOpen={showClosureModal} 
                onClose={() => setShowClosureModal(false)} 
                form={closureForm} 
                setForm={setClosureForm} 
                onAdd={onAddClosure} 
                modalRef={closureModalRef} 
            />
            
            <ResetModal 
                isOpen={showResetModal} 
                onClose={() => setShowResetModal(false)} 
                confirmText={resetConfirmText} 
                setConfirmText={setResetConfirmText} 
                onReset={onFactoryReset} 
                isResetting={isResetting} 
                modalRef={resetModalRef} 
            />
        </div>
    );
}
