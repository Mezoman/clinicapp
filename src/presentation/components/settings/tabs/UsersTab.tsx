import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, AlertTriangle, UserPlus, Loader2, Crown, Shield, Users, RefreshCw } from 'lucide-react';
import { supabase } from '../../../../infrastructure/clients/supabase';
import { toast } from 'sonner';
import { logger } from '../../../../utils/logger';

interface AdminUserRecord {
    id: string;
    email: string;
    role: 'admin' | 'super_admin' | 'receptionist';
    display_name?: string | null;
    created_at: string;
}

export const UsersTab: React.FC<{ isSuperAdmin: boolean }> = React.memo(({ isSuperAdmin }) => {
    const [users, setUsers] = useState<AdminUserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingRole, setUpdatingRole] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        if (!isSuperAdmin) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('admin_users')
                .select('id, email, role, display_name, created_at')
                .order('created_at');

            if (error) {
                logger.error('Failed to fetch admin users', error);
                toast.error('فشل في تحميل قائمة المستخدمين');
            } else {
                setUsers(data ?? []);
            }
        } catch (err) {
            logger.error('Error fetching users', err as Error);
        } finally {
            setLoading(false);
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleToggleRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'super_admin' ? 'admin' : 'super_admin';
        setUpdatingRole(userId);
        try {
            const { error } = await supabase
                .from('admin_users')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) {
                toast.error('فشل في تحديث الدور');
                logger.error('Failed to update role', error);
            } else {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as 'admin' | 'super_admin' } : u));
                toast.success(`تم تغيير الدور إلى ${newRole === 'super_admin' ? 'مدير عام' : 'مشرف'}`);
            }
        } catch (err) {
            logger.error('Error toggling role', err as Error);
            toast.error('حدث خطأ غير متوقع');
        } finally {
            setUpdatingRole(null);
        }
    };

    if (!isSuperAdmin) {
        return (
            <div className="bg-white dark:bg-secondary-900 rounded-[3rem] p-24 border-[1.5px] border-slate-300 dark:border-secondary-800 shadow-xl flex flex-col items-center text-center space-y-8 animate-in zoom-in-95">
                <div className="size-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center">
                    <AlertTriangle aria-hidden={true} className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">وصول مقيد</h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold max-w-md leading-loose">
                    هذا القسم مخصص للمدير العام للنظام فقط. يرجى تسجيل الدخول بحساب المدير العام للوصول لهذه الإعدادات.
                </p>
            </div>
        );
    }

    return (
        <section className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-white dark:bg-secondary-900 rounded-[2.5rem] border-[1.5px] border-slate-300 dark:border-secondary-800 shadow-sm p-8 sm:p-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                            <Users className="size-7" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">إدارة المستخدمين والأدوار</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">إدارة حسابات المشرفين وصلاحياتهم</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchUsers}
                            className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-secondary-800 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-secondary-700 transition-all active:scale-95"
                        >
                            <RefreshCw className="size-4" />
                            تحديث
                        </button>
                    </div>
                </div>
            </div>

            {/* Users List */}
            <div className="bg-white dark:bg-secondary-900 rounded-[2.5rem] border-[1.5px] border-slate-300 dark:border-secondary-800 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="size-10 text-primary animate-spin" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">جاري تحميل المستخدمين...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                        <div className="size-20 bg-slate-50 dark:bg-secondary-800 rounded-3xl flex items-center justify-center">
                            <ShieldCheck className="size-10 text-slate-300" />
                        </div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">لا يوجد مستخدمون مسجلون</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-secondary-800">
                        {users.map(user => (
                            <div key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 hover:bg-slate-50/50 dark:hover:bg-secondary-800/30 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={`size-12 rounded-2xl flex items-center justify-center shadow-inner font-black text-lg ${user.role === 'super_admin' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                                        {(user.display_name || user.email).charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <p className="font-black text-slate-900 dark:text-white">
                                                {user.display_name || user.email.split('@')[0]}
                                            </p>
                                            {user.role === 'super_admin' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-amber-200/50 dark:border-amber-800/30">
                                                    <Crown className="size-3" />
                                                    مدير عام
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest border border-primary/10">
                                                    <Shield className="size-3" />
                                                    مشرف
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 font-bold mt-1 font-numbers" dir="ltr">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 self-end sm:self-center">
                                    <button
                                        onClick={() => handleToggleRole(user.id, user.role)}
                                        disabled={updatingRole === user.id}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-secondary-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all active:scale-95 disabled:opacity-50 border border-slate-200 dark:border-secondary-700"
                                    >
                                        {updatingRole === user.id ? (
                                            <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="size-3.5" />
                                        )}
                                        تغيير الدور
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Invite User Note */}
            <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-8 text-right">
                <div className="flex items-start gap-4">
                    <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 mt-1">
                        <UserPlus className="size-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-black text-sm text-primary mb-2">دعوة مستخدم جديد</h4>
                        <p className="text-xs font-bold text-slate-500 leading-relaxed">
                            لإضافة مستخدم جديد للنظام، يرجى إنشاء حساب من لوحة تحكم Supabase أو استخدام خاصية دعوة المستخدم عبر البريد الإلكتروني.
                            سيتم دعم الدعوة المباشرة من هذه الواجهة في تحديث قادم عبر Edge Function.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
});
