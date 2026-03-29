import { useState } from 'react';
import { useConfig } from '../../../presentation/hooks/useConfig';
import { Loader2 } from 'lucide-react';
import { useCMSContent } from '../../../presentation/hooks/useCMSContent';
import { TabId, TABS } from '../../components/cms/types';
import { CMSSidebar } from '../../components/cms/CMSSidebar';
import { 
    OverviewTab, BrandingTab, HeroTab, NavbarTab, 
    ServicesTab, CredentialsTab, WhyUsTab, WhatsappTab, 
    FooterTab, ColorsTab 
} from '../../components/cms/tabs';

export default function CMSManager() {
    const { cloudinaryCloudName, cloudinaryUploadPreset } = useConfig();
    const { loading, cmsMap, handleSave: saveCMS, load } = useCMSContent();
    const [activeTab, setActiveTab] = useState<TabId>('overview');

    const handleSave = (section: string, data: any): Promise<void> => {
        return saveCMS(section, data).then(() => {
            load();
        });
    };

    const activeTabInfo = TABS.find(t => t.id === activeTab);

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" role="status" aria-label="جاري التحميل" />
                <p className="text-sm text-[var(--text-secondary)] font-black uppercase tracking-widest">جاري تحميل محتوى الموقع...</p>
            </div>
        </div>
    );

    if (!activeTabInfo) return null;

    const cloud = { name: cloudinaryCloudName || '', preset: cloudinaryUploadPreset || '' };

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 bg-transparent" dir="rtl">
            <CMSSidebar activeTab={activeTab} setActiveTab={setActiveTab} onRefresh={load} />

            <div className="flex-1 min-w-0 relative">
                <div className="max-w-5xl mx-auto pb-32">
                    <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 mb-14 animate-in slide-in-from-top-10 duration-700">
                        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-right">
                            <div className="size-16 sm:size-20 bg-primary rounded-[2rem] flex items-center justify-center text-white flex-shrink-0 shadow-2xl shadow-primary/30 transition-transform hover:scale-110">
                                <activeTabInfo.icon className="w-8 h-8 sm:w-10 h-10" />
                            </div>
                            <div className="space-y-1 sm:space-y-2">
                                <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] font-display uppercase tracking-widest leading-tight">{activeTabInfo.label}</h1>
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{activeTabInfo.description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-3 bg-[var(--bg-card)] rounded-[1.5rem] border-[1.5px] border-[var(--border-color)] shadow-sm self-center md:self-start">
                            <div className="size-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/20" />
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">تعديل مباشر فعّال</span>
                        </div>
                    </div>

                    <div className="space-y-12 animate-in slide-in-from-bottom-10 duration-700">
                        {activeTab === 'overview' && <OverviewTab setActiveTab={setActiveTab} />}
                        {activeTab === 'branding' && <BrandingTab cmsMap={cmsMap} onSave={handleSave} cloudName={cloud.name} preset={cloud.preset} />}
                        {activeTab === 'hero' && <HeroTab cmsMap={cmsMap} onSave={handleSave} cloudName={cloud.name} preset={cloud.preset} />}
                        {activeTab === 'navbar' && <NavbarTab cmsMap={cmsMap} onSave={handleSave} />}
                        {activeTab === 'services' && <ServicesTab cmsMap={cmsMap} onSave={handleSave} />}
                        {activeTab === 'credentials' && <CredentialsTab cmsMap={cmsMap} onSave={handleSave} />}
                        {activeTab === 'whyus' && <WhyUsTab cmsMap={cmsMap} onSave={handleSave} cloudName={cloud.name} preset={cloud.preset} />}
                        {activeTab === 'whatsapp' && <WhatsappTab cmsMap={cmsMap} onSave={handleSave} />}
                        {activeTab === 'footer' && <FooterTab cmsMap={cmsMap} onSave={handleSave} />}
                        {activeTab === 'colors' && <ColorsTab cmsMap={cmsMap} onSave={handleSave} />}
                    </div>
                </div>
            </div>
        </div>
    );
}
