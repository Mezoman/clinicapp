import { 
    Palette, Layout, Grid, MessageCircle, AlignLeft, Zap, 
    Star, Link, Trophy
} from 'lucide-react';

export type TabId = 'overview' | 'branding' | 'hero' | 'navbar' | 'services' | 'credentials' | 'whyus' | 'whatsapp' | 'footer' | 'colors';

export interface CMSTab {
    id: TabId;
    label: string;
    icon: any;
    description: string;
    badge?: string;
}

export interface ServiceItem {
    id: string;
    name: string;
    description: string;
    icon: string;
    price: number;
    visible: boolean;
}

export interface WhyUsItem {
    title: string;
    desc: string;
    icon: string;
}

export const TABS: CMSTab[] = [
    { id: 'overview', label: 'نظرة عامة', icon: Layout, description: 'ملخص حالة الموقع واختصارات سريعة' },
    { id: 'branding', label: 'الهوية البصرية', icon: Palette, description: 'الشعار واسم العيادة' },
    { id: 'hero', label: 'قسم البداية', icon: Layout, description: 'البانر الرئيسي والنصوص الترحيبية' },
    { id: 'navbar', label: 'شريط التنقل', icon: Link, description: 'روابط المنيو وأزرار الحجز' },
    { id: 'services', label: 'الخدمات', icon: Grid, description: 'إدارة الخدمات والأسعار', badge: 'مميز' },
    { id: 'credentials', label: 'المؤهلات', icon: Trophy, description: 'الشهادات والاعتمادات العلمية' },
    { id: 'whyus', label: 'لماذا نحن؟', icon: Star, description: 'مميزات العيادة وتجهيزاتها' },
    { id: 'whatsapp', label: 'واتساب', icon: MessageCircle, description: 'إعدادات التواصل الفوري', badge: 'نشط' },
    { id: 'footer', label: 'التذييل', icon: AlignLeft, description: 'معلومات التواصل وحقوق النشر' },
    { id: 'colors', label: 'الألوان والثيم', icon: Zap, description: 'تخصيص ألوان المنصة بالكامل' },
];
