import React from 'react';
import { Monitor, RefreshCw } from 'lucide-react';
import { TabId, TABS } from './types';
import { useBreakpoint } from '../../hooks/useBreakpoint';

interface CMSSidebarProps {
    activeTab: TabId;
    setActiveTab: (id: TabId) => void;
    onRefresh: () => void;
}

export const CMSSidebar: React.FC<CMSSidebarProps> = ({ activeTab, setActiveTab, onRefresh }) => {
    const { isDesktop } = useBreakpoint();

    return (
        <aside className="w-full lg:w-80 shrink-0 bg-white dark:bg-secondary-900 rounded-[2rem] border border-slate-200 dark:border-secondary-800 flex flex-col shadow-xl lg:sticky lg:top-0 z-10">
            {isDesktop && (
                <div className="p-8 border-b border-slate-50 dark:border-secondary-800 flex items-center gap-4">
                    <div className="size-12 bg-primary-500 rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-primary-500/30 transition-transform hover:rotate-12 shrink-0">
                        <Monitor className="w-7 h-7 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-black text-slate-900 dark:text-white text-base font-display uppercase tracking-widest truncate">إدارة المحتوى</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">التحكم في واجهة الموقع</p>
                    </div>
                </div>
            )}
            
            <nav 
                role="tablist" 
                className={`flex-1 p-4 lg:p-6 space-x-2 space-x-reverse lg:space-x-0 lg:space-y-2 overflow-auto custom-scrollbar flex lg:flex-col ${isDesktop ? 'max-h-[calc(100vh-16rem)]' : ''}`}
            >
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            role="tab"
                            aria-selected={isActive}
                            className={`flex items-center gap-3 px-5 py-4 lg:px-6 lg:py-5 rounded-[1.25rem] lg:text-right transition-all group shrink-0 ${
                                isActive 
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 lg:translate-y-[-2px]' 
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-secondary-800'
                            }`}
                        >
                            <Icon aria-hidden={true} className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary-500'}`} />
                            <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                                <span className="text-sm font-black uppercase tracking-widest whitespace-nowrap">{tab.label}</span>
                                {tab.badge && (
                                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest flex-shrink-0 ${
                                        isActive 
                                            ? 'bg-white/20 text-white' 
                                            : 'bg-primary-500/10 text-primary-500 group-hover:bg-primary-500 group-hover:text-white'
                                    } transition-colors`}>
                                        {tab.badge}
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </nav>
            
            {isDesktop && (
                <div className="p-6 border-t border-slate-50 dark:border-secondary-800">
                    <button 
                        onClick={onRefresh} 
                        className="w-full flex items-center justify-center gap-3 h-14 bg-slate-50 dark:bg-secondary-800 border-none rounded-2xl text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all group"
                    >
                        <RefreshCw className="w-4 h-4 group-active:rotate-180 transition-transform duration-500" />
                        تزامن البيانات
                    </button>
                </div>
            )}
        </aside>
    );
};
