import { useState, type FormEvent } from 'react';
import { supabase } from '../../../infrastructure/clients/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRateLimit } from '../../hooks/useRateLimit';
import { sanitize } from '../../../lib/validation';
import { 
    Eye, 
    EyeOff, 
    LogIn, 
    Stethoscope, 
    Loader2, 
    Mail, 
    Lock,
    Moon,
    Sun,
    Languages,
    ArrowRight
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { toast } from 'sonner';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isForgotPassword, setIsForgotPassword] = useState(false);

    const { setTheme, effectiveTheme } = useTheme();

    const { signIn } = useAuth();
    const { registerAction, resetLimit, isLimited, timeLeft } = useRateLimit('admin_login', 15 * 60000, 5);
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (isLimited || isSubmitting) return;

        if (!email.trim() || !password.trim()) {
            setError('يرجى ملء جميع الحقول');
            return;
        }

        setIsSubmitting(true);
        setError('');

        const result = await signIn(sanitize(email.trim()), password);
        if (!result.success) {
            registerAction();
            setError(result.error);
        } else {
            resetLimit();
            navigate(from, { replace: true });
        }
        setIsSubmitting(false);
    }

    return (
        <div className="flex min-h-screen w-full flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 font-display transition-colors duration-500 overflow-hidden" dir="rtl">
            {/* Right Side: Visual/Branding Section (RTL Order) */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#1E3A5F] relative overflow-hidden items-center justify-center p-12 shrink-0">
                {/* Geometric Pattern Overlay */}
                <div className="absolute inset-0 opacity-40 dental-pattern" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                {/* Abstract Decorative Elements */}
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
                    <div className="mb-8 p-8 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 animate-in zoom-in-50 duration-700 shadow-2xl">
                        <Stethoscope className="w-16 h-16 text-white" />
                    </div>
                    <h1 className="text-white text-4xl lg:text-5xl font-black mb-6 leading-tight animate-in slide-in-from-bottom-6 duration-700 font-display">نظام إدارة عيادة الأسنان المتطور</h1>
                    <p className="text-blue-100/80 text-lg font-bold leading-relaxed mb-12 animate-in slide-in-from-bottom-8 duration-700">
                        حلول رقمية متكاملة لتنظيم مواعيد المرضى، السجلات الطبية، والعمليات الإدارية بكل سهولة واحترافية.
                    </p>
                    
                    {/* Illustration Placeholder */}
                    <div className="w-full aspect-square max-w-sm rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 bg-[#eff6ff] flex items-center justify-center animate-in zoom-in-90 duration-1000">
                        <div className="flex flex-col items-center gap-6">
                            <div className="size-32 bg-primary-500/10 rounded-[2.5rem] flex items-center justify-center animate-pulse">
                                <Stethoscope className="w-16 h-16 text-primary-500" />
                            </div>
                            <div className="space-y-3 flex flex-col items-center">
                                <div className="w-32 h-2.5 bg-primary-500/20 rounded-full"></div>
                                <div className="w-20 h-2.5 bg-primary-500/10 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8 text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
                    © {new Date().getFullYear()} DCMS — PROFESSIONAL CLINIC MANAGEMENT
                </div>
            </div>

            {/* Left Side: Login Form Section */}
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950 p-6 sm:p-12 lg:p-20 relative overflow-y-auto custom-scrollbar">
                <div className="w-full max-w-md animate-in slide-in-from-left-8 duration-700">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-500/10 rounded-[2rem] mb-6 shadow-sm group hover:scale-110 transition-transform">
                            <Stethoscope className="w-10 h-10 text-primary-500" />
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight font-display">تسجيل الدخول</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">مرحباً بك مجدداً، يرجى إدخال بياناتك للوصول</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-[1.5rem] animate-in shake duration-500">
                            <p className="text-red-600 dark:text-red-400 text-xs text-center font-black uppercase tracking-widest">{error}</p>
                        </div>
                    )}

                    {isForgotPassword ? (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                            <div className="space-y-3">
                                <label htmlFor="reset-email" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2">البريد الإلكتروني للتعافي</label>
                                <div className="relative group">
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input 
                                        id="reset-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pr-14 pl-5 py-4 bg-slate-50 dark:bg-secondary-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500/50 outline-none transition-all text-slate-900 dark:text-white font-bold ltr-text h-16" 
                                        placeholder="admin@clinic.com" 
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!email.trim()) {
                                            setError('يرجى إدخال البريد الإلكتروني');
                                            return;
                                        }
                                        setError('');
                                        setIsSubmitting(true);
                                        try {
                                            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                                                redirectTo: `${window.location.origin}/admin/login`
                                            });
                                            if (error) throw error;
                                            toast.success('تم إرسال رابط استعادة كلمة المرور');
                                            setIsForgotPassword(false);
                                        } catch (err) {
                                            setError(err instanceof Error ? err.message : 'فشل في إرسال الرابط');
                                        } finally {
                                            setIsSubmitting(false);
                                        }
                                    }}
                                    disabled={isSubmitting}
                                    className="flex-1 h-16 bg-primary-500 hover:bg-primary-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-primary-500/20 active:scale-[0.98] text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /><span>جاري الإرسال...</span></>
                                    ) : (
                                        'إرسال الرابط'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsForgotPassword(false); setIsSubmitting(false); setError(''); }}
                                    className="h-16 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-secondary-800 dark:hover:bg-secondary-700 text-slate-600 dark:text-slate-300 font-black rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8" autoComplete="on">
                            <div className="space-y-3">
                                <label htmlFor="email" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2">البريد الإلكتروني</label>
                                <div className="relative group">
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input 
                                        id="email"
                                        name="username"
                                        type="email"
                                        autoComplete="username"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pr-14 pl-5 py-4 bg-slate-50 dark:bg-secondary-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500/50 outline-none transition-all text-slate-900 dark:text-white font-bold ltr-text h-16" 
                                        placeholder="admin@clinic.com" 
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center mr-2">
                                    <label htmlFor="password" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">كلمة المرور</label>
                                    <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[10px] text-primary-500 hover:text-primary-600 font-black uppercase tracking-widest transition-colors">نسيت كلمة المرور؟</button>
                                </div>
                                <div className="relative group">
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input 
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pr-14 pl-14 py-4 bg-slate-50 dark:bg-secondary-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500/50 outline-none transition-all text-slate-900 dark:text-white font-bold ltr-text h-16" 
                                        placeholder="••••••••" 
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <button 
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-500 transition-colors cursor-pointer p-2 rounded-xl hover:bg-white dark:hover:bg-secondary-700 shadow-sm" 
                                        type="button"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mr-2">
                                <input className="size-5 rounded-lg border-none bg-slate-50 dark:bg-secondary-800 text-primary-500 focus:ring-2 focus:ring-primary-500/50 transition-all cursor-pointer" id="remember" type="checkbox"/>
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest cursor-pointer" htmlFor="remember">تذكرني على هذا الجهاز</label>
                            </div>

                            <button 
                                className="w-full h-16 bg-primary-500 hover:bg-primary-600 text-white font-black rounded-2xl transition-all shadow-2xl shadow-primary-500/20 active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-not-allowed group text-xs uppercase tracking-[0.3em]" 
                                type="submit"
                                disabled={isSubmitting || isLimited}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>جاري تسجيل الدخول...</span>
                                    </>
                                ) : isLimited ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>محظور مؤقتاً ({timeLeft}ث)</span>
                                    </>
                                ) : (
                                    <>
                                        <span>دخول لوحة التحكم</span>
                                        <LogIn className="w-5 h-5 group-hover:translate-x-[-6px] transition-all" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-16 text-center border-t border-slate-50 dark:border-secondary-800 pt-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">هل تواجه مشكلة في الدخول؟ <button className="text-primary-500 hover:underline">اتصل بالدعم الفني</button></p>
                        <div className="flex justify-center gap-12">
                            <button 
                                onClick={() => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')}
                                className="flex items-center gap-3 text-[10px] font-black text-slate-400 hover:text-primary-500 transition-all uppercase tracking-widest group"
                            >
                                {effectiveTheme === 'dark' ? (
                                    <>
                                        <Sun className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                        <span>الوضع الفاتح</span>
                                    </>
                                ) : (
                                    <>
                                        <Moon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                        <span>الوضع الليلي</span>
                                    </>
                                )}
                            </button>
                            <button 
                                disabled
                                className="flex items-center gap-3 text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest group cursor-not-allowed"
                            >
                                <Languages className="w-4 h-4" />
                                <span>English</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
