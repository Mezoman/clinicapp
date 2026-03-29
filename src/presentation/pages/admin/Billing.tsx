import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    Receipt, 
    Plus, 
    Loader2, 
    Banknote, 
    Printer, 
    X, 
    CreditCard,
    Wallet,
    FileSpreadsheet,
    AlertCircle,
    Eye,
    Share,
    ChevronRight,
    ChevronLeft,
    Clock,
    Search,
    CheckCircle2,
    Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { app } from '../../../application/container';
import { exportInvoicesToExcel } from '../../../utils/exportUtils';
import { INVOICE_STATUS_MAP, PAYMENT_METHOD_MAP } from '../../../constants';
import { formatDate, toISODateString } from '../../../utils/dateUtils';
import { formatCurrency } from '../../../utils/formatters';
import { sanitize } from '../../../lib/validation';
import { InvoiceDTO, PaymentMethodDTO } from '../../../application/dtos/billing.dto';
import { ClinicSettingsDTO } from '../../../application/dtos/settings.dto';
import InvoicePrintTemplate from '../../components/InvoicePrintTemplate';
import InvoiceBuilder, { CreateInvoiceFormData } from '../../components/billing/InvoiceBuilder';
import InstallmentManager from '../../components/billing/InstallmentManager';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export interface InvoiceNavigationInit {
    patientId?: string;
    patientName?: string | undefined;
    highlightInvoice?: string;
}

export default function Billing() {
    const location = useLocation();
    const [invoices, setInvoices] = useState<readonly InvoiceDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showInstallmentsModal, setShowInstallmentsModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDTO | null>(null);
    const [invoiceNavigationInit, setInvoiceNavigationInit] = useState<InvoiceNavigationInit | null>(null);
    const [saving, setSaving] = useState(false);
    const [summary, setSummary] = useState({ monthlyRevenue: 0, yearlyRevenue: 0, totalOutstanding: 0, pendingInvoices: 0, totalInvoiced: 0, totalPaid: 0 });
    const [settings, setSettings] = useState<ClinicSettingsDTO | null>(null);

    const invoiceModalRef = useRef<HTMLDivElement>(null);
    const paymentModalRef = useRef<HTMLDivElement>(null);
    const installmentsModalRef = useRef<HTMLDivElement>(null);

    useFocusTrap(invoiceModalRef, showInvoiceModal, () => { setShowInvoiceModal(false); setInvoiceNavigationInit(null); });
    useFocusTrap(paymentModalRef, showPaymentModal, () => setShowPaymentModal(false));
    useFocusTrap(installmentsModalRef, showInstallmentsModal, () => setShowInstallmentsModal(false));

    // Filters state
    const [filters, setFilters] = useState({
        status: 'all',
        dateFrom: '',
        dateTo: '',
        search: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [highlightedInvoiceId, setHighlightedInvoiceId] = useState<string | null>(null);
    const itemsPerPage = 10;

    const [paymentForm, setPaymentForm] = useState({ amount: 0, method: 'cash' as PaymentMethodDTO, notes: '' });

    const isComponentMounted = useRef(true);
    useEffect(() => {
        isComponentMounted.current = true;
        return () => { isComponentMounted.current = false; };
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        const [result, sum] = await Promise.all([
            app.billingService.getInvoices(),
            app.billingService.getDashboardKPIs()
        ]);
        if (isComponentMounted.current) {
            if (result.success && sum.success) {
                setInvoices(result.data);
                setSummary(sum.data);
            } else {
                if (!result.success || !sum.success) {
                    toast.error(result.success ? sum.error : result.error);
                }
            }
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const refresh = useCallback(() => { load(); }, [load]);

    useEffect(() => {
        async function loadSettings() {
            const result = await app.settingsService.getSettings();
            if (isComponentMounted.current && result.success && result.data) setSettings(result.data);
        }
        loadSettings();
    }, []);

    // Handle incoming state from Appointments
    useEffect(() => {
        const state = location.state as InvoiceNavigationInit | null;
        if (state?.patientId) {
            setInvoiceNavigationInit({ patientId: state.patientId, patientName: state.patientName ?? '' });
            setShowInvoiceModal(true);
            window.history.replaceState({}, document.title);
        }
        if (state?.highlightInvoice) {
            setHighlightedInvoiceId(state.highlightInvoice);
        }
    }, [location.state]);

    useEffect(() => {
        if (!highlightedInvoiceId) return;
        const el = document.getElementById(`invoice-${highlightedInvoiceId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [highlightedInvoiceId]);

    const filteredInvoices = useMemo(() => {
        const todayStr = toISODateString(new Date());
        return invoices.filter(inv => {
            let matchStatus = filters.status === 'all' || inv.status === filters.status;

            if (filters.status === 'overdue') {
                matchStatus = inv.status === 'overdue' ||
                    (inv.status === 'unpaid' && !!inv.dueDate && inv.dueDate < todayStr);
            }

            const matchSearch = !filters.search ||
                inv.patientName?.toLowerCase().includes(filters.search.toLowerCase()) ||
                inv.invoiceNumber.toLowerCase().includes(filters.search.toLowerCase());
            const matchDateFrom = !filters.dateFrom || inv.invoiceDate >= filters.dateFrom;
            const matchDateTo = !filters.dateTo || inv.invoiceDate <= filters.dateTo;
            return matchStatus && matchSearch && matchDateFrom && matchDateTo;
        });
    }, [invoices, filters]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const paginatedInvoices = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredInvoices.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredInvoices, currentPage]);

    const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));

    async function handleCreateInvoice(data: CreateInvoiceFormData) {
        setSaving(true);
        try {
            const result = await app.billingService.createInvoice(data);
            if (result.success) {
                toast.success('تم إنشاء الفاتورة بنجاح');
                setShowInvoiceModal(false);
                refresh();
            } else {
                toast.error(result.error || 'فشل في إنشاء الفاتورة');
            }
        } catch {
            toast.error('حدث خطأ غير متوقع');
        } finally {
            setSaving(false);
        }
    }

    async function handleAddPayment() {
        if (!selectedInvoice || paymentForm.amount <= 0) { toast.error('يرجى إدخال مبلغ صحيح'); return; }
        setSaving(true);
        try {
            const result = await app.billingService.processPayment(selectedInvoice.id, {
                amount: paymentForm.amount,
                method: paymentForm.method,
                notes: sanitize(paymentForm.notes.trim()) || undefined,
            });
            if (result.success) {
                toast.success('تم تسجيل الدفعة بنجاح');
                setShowPaymentModal(false);
                refresh();
            } else {
                toast.error(result.error || 'فشل في تسجيل الدفعة');
            }
        } catch {
            toast.error('حدث خطأ غير متوقع');
        } finally {
            setSaving(false);
        }
    }

    function handlePrint(invoice: InvoiceDTO) {
        setSelectedInvoice(invoice);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => window.print());
        });
    }

    const statuses = [
        { id: 'all', label: 'الكل' },
        { id: 'unpaid', label: 'غير مدفوعة' },
        { id: 'partial', label: 'دفع جزئي' },
        { id: 'paid', label: 'مدفوعة' },
        { id: 'overdue', label: 'متأخرة' },
    ];

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen space-y-8">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] flex items-center gap-3 font-display">
                        <Receipt className="w-8 h-8 sm:w-9 sm:h-9 text-primary" />
                        الفواتير والمدفوعات
                    </h1>
                    <p className="text-slate-500 font-bold mt-1">إدارة السجلات المالية والتحصيلات في العيادة</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={() => exportInvoicesToExcel([...filteredInvoices])}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 dark:bg-secondary-800 text-slate-500 dark:text-slate-400 rounded-2xl border-b-2 border-slate-200 dark:border-secondary-700 font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95 group"
                    >
                        <Printer className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        <span>طباعة التقارير</span>
                    </button>
                    <button 
                        onClick={() => { setSelectedInvoice(null); setShowInvoiceModal(true); }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 border-b-4 border-primary-700 hover:bg-primary/90 transition-all active:scale-95 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        <span>فاتورة جديدة</span>
                    </button>
                </div>
            </header>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[var(--bg-card)] p-6 rounded-[2rem] border-[1.5px] border-[var(--border-color)] shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-primary/5 transition-all">
                    <div className="absolute -right-4 -top-4 size-24 bg-primary/5 rounded-full group-hover:scale-110 transition-transform"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-slate-500 text-xs font-black uppercase tracking-widest leading-none">إيراد الشهر</p>
                            <div className="p-2 bg-primary/10 text-primary rounded-xl">
                                <Wallet className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            {loading ? (
                                <div className="h-8 w-32 bg-[var(--bg-page)] rounded-lg animate-pulse mb-2" />
                            ) : (
                                <h3 className="text-2xl font-black text-[var(--text-primary)] font-numbers leading-none mb-2">{formatCurrency(summary.monthlyRevenue)}</h3>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] p-6 rounded-[2rem] border-[1.5px] border-[var(--border-color)] shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                    <div className="absolute -right-4 -top-4 size-24 bg-blue-500/5 rounded-full group-hover:scale-110 transition-transform"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-slate-500 text-xs font-black uppercase tracking-widest leading-none">إجمالي الفواتير</p>
                            <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                                <FileSpreadsheet className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            {loading ? (
                                <>
                                    <div className="h-8 w-24 bg-[var(--bg-page)] rounded-lg animate-pulse mb-2" />
                                    <div className="h-3 w-32 bg-[var(--bg-page)] rounded-full animate-pulse" />
                                </>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] font-display leading-none mb-2">{invoices.length} فاتورة</h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">إجمالي السجلات المسجلة</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] p-6 rounded-[2rem] border-[1.5px] border-[var(--border-color)] shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-red-500/5 transition-all">
                    <div className="absolute -right-4 -top-4 size-24 bg-red-500/5 rounded-full group-hover:scale-110 transition-transform"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-slate-500 text-xs font-black uppercase tracking-widest leading-none">مدفوعات معلقة</p>
                            <div className="p-2 bg-red-50 text-red-500 rounded-xl">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            {loading ? (
                                <>
                                    <div className="h-8 w-32 bg-[var(--bg-page)] rounded-lg animate-pulse mb-2" />
                                    <div className="h-3 w-40 bg-[var(--bg-page)] rounded-full animate-pulse" />
                                </>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-black text-red-600 dark:text-red-400 font-numbers leading-none mb-2">{formatCurrency(summary.totalOutstanding)}</h3>
                                    <div className="flex items-center gap-1 text-red-500 text-xs font-black uppercase tracking-tighter">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>{summary.pendingInvoices} بانتظار التحصيل</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] p-6 rounded-[2rem] border-[1.5px] border-[var(--border-color)] shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
                    <div className="absolute -right-4 -top-4 size-24 bg-emerald-500/5 rounded-full group-hover:scale-110 transition-transform"></div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-slate-500 text-xs font-black uppercase tracking-widest leading-none">نسبة التحصيل</p>
                            <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            {loading ? (
                                <>
                                    <div className="flex justify-between mb-2">
                                        <div className="h-8 w-16 bg-[var(--bg-page)] rounded-lg animate-pulse" />
                                        <div className="h-4 w-12 bg-[var(--bg-page)] rounded-lg animate-pulse" />
                                    </div>
                                    <div className="w-full bg-[var(--bg-page)] h-1.5 rounded-full animate-pulse" />
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-2xl font-black text-[var(--text-primary)] font-display leading-none">
                                            {summary.totalInvoiced > 0 ? Math.round((summary.totalPaid / summary.totalInvoiced) * 100) : 0}%
                                        </h3>
                                        <span className="text-xs font-black text-emerald-500 uppercase">
                                            {summary.totalInvoiced > 0 && (summary.totalPaid / summary.totalInvoiced) >= 0.8 ? 'ممتاز' : 'جيد'}
                                        </span>
                                    </div>
                                    <div className="w-full bg-emerald-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                                            style={{ width: `${summary.totalInvoiced > 0 ? Math.round((summary.totalPaid / summary.totalInvoiced) * 100) : 0}%` }}
                                        ></div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoices List Section */}
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] border-[1.5px] border-[var(--border-color)] shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-[var(--border-subtle)] space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-2 p-1 bg-[var(--bg-page)] rounded-2xl w-full sm:w-fit border border-[var(--border-subtle)] overflow-x-auto custom-scrollbar no-scrollbar">
                            {statuses.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setFilters(f => ({ ...f, status: s.id }))}
                                    aria-pressed={filters.status === s.id}
                                    className={`px-4 sm:px-6 py-2 rounded-[1rem] text-xs sm:text-sm font-black transition-all whitespace-nowrap ${
                                        filters.status === s.id 
                                            ? 'bg-[var(--bg-card)] text-primary shadow-md shadow-slate-200 dark:shadow-none translate-y-[-1px]' 
                                            : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <div className="relative group flex-1 lg:w-80">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                                <input 
                                    aria-label="البحث في الفواتير"
                                    value={filters.search}
                                    onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                                    className="w-full pr-12 pl-4 py-3 bg-[var(--bg-page)] border border-transparent rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary/20 outline-none transition-all text-[var(--text-primary)]" 
                                    placeholder="رقم الفاتورة، اسم المريض..." 
                                    type="text"
                                />
                            </div>
                            <button disabled title="قادمًا قريباً" className="p-3 bg-[var(--bg-page)] text-slate-400 hover:text-primary rounded-2xl border border-[var(--border-subtle)] transition-all shadow-sm active:scale-95 opacity-50 cursor-not-allowed hidden sm:block">
                                <Share className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-6 border-t border-[var(--border-subtle)]">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">الفترة من</span>
                            <input 
                                type="date" 
                                aria-label="من تاريخ"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                                className="bg-[var(--bg-page)] border border-transparent rounded-xl text-xs font-bold p-2 focus:ring-4 focus:ring-primary/10 focus:border-primary/20 outline-none text-[var(--text-primary)] w-full sm:w-auto" 
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">إلى</span>
                            <input 
                                type="date" 
                                aria-label="إلى تاريخ"
                                value={filters.dateTo}
                                onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                                className="bg-[var(--bg-page)] border border-transparent rounded-xl text-xs font-bold p-2 focus:ring-4 focus:ring-primary/10 focus:border-primary/20 outline-none text-[var(--text-primary)] w-full sm:w-auto" 
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
                    <table className="w-full text-right border-collapse min-w-[800px] dcms-table">
                        <thead className="bg-[var(--bg-table-header)]">
                            <tr>
                                <th className="px-6 py-4 text-[var(--text-muted)] text-xs font-black uppercase tracking-wide">رقم الفاتورة</th>
                                <th className="px-6 py-4 text-[var(--text-muted)] text-xs font-black uppercase tracking-wide">المريض</th>
                                <th className="px-6 py-4 text-[var(--text-muted)] text-xs font-black uppercase tracking-wide">التاريخ</th>
                                <th className="px-6 py-4 text-[var(--text-muted)] text-xs font-black uppercase tracking-wide">الإجمالي</th>
                                <th className="px-6 py-4 text-[var(--text-muted)] text-xs font-black uppercase tracking-wide">المدفوع</th>
                                <th className="px-6 py-4 text-[var(--text-muted)] text-xs font-black uppercase tracking-wide">المتبقي</th>
                                <th className="px-6 py-4 text-[var(--text-muted)] text-xs font-black uppercase tracking-wide">الحالة</th>
                                <th className="px-6 py-4 text-[var(--text-muted)] text-xs font-black uppercase tracking-wide text-left">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={8} className="px-8 py-5">
                                            <div className="h-14 bg-[var(--bg-page)] rounded-xl w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                                            <Receipt className="w-16 h-16 text-slate-300" />
                                            <p className="text-slate-400 font-bold text-lg">لا توجد فواتير مطابقة لخيارات البحث</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedInvoices.map((inv) => {
                                    const status = INVOICE_STATUS_MAP[inv.status as keyof typeof INVOICE_STATUS_MAP] || INVOICE_STATUS_MAP.issued;
                                    const initial = inv.patientName?.charAt(0) || 'م';
                                    const isHighlighted = highlightedInvoiceId === inv.id;
                                    return (
                                        <tr 
                                            key={inv.id} 
                                            id={`invoice-${inv.id}`}
                                            className={`hover:bg-[var(--bg-page)]/50 transition-all group ${isHighlighted ? 'ring-2 ring-inset ring-primary' : ''}`}
                                        >
                                            <td className="px-8 py-6 font-mono text-xs font-black text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">#{inv.invoiceNumber}</td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 rounded-2xl bg-[var(--bg-page)] flex items-center justify-center font-black text-xs text-slate-400 border border-[var(--border-subtle)] group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">{initial}</div>
                                                    <span className="font-black text-[var(--text-primary)] text-sm">{inv.patientName}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-bold text-slate-500 dark:text-slate-400">{formatDate(inv.invoiceDate)}</td>
                                            <td className="px-8 py-6 text-sm font-black text-[var(--text-primary)] font-numbers">{formatCurrency(inv.total)}</td>
                                            <td className="px-8 py-6 text-sm text-emerald-600 font-black font-numbers">{formatCurrency(inv.totalPaid)}</td>
                                            <td className="px-8 py-6 text-sm text-red-500 font-black font-numbers">{inv.balance > 0 ? formatCurrency(inv.balance) : '-'}</td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${
                                                    inv.status === 'paid' 
                                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                                                        : inv.status === 'partial' 
                                                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                        : inv.status === 'overdue' || inv.status === 'unpaid'
                                                        ? 'bg-red-500/10 text-red-600 border-red-500/20'
                                                        : 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                                                }`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => handlePrint(inv)}
                                                        className="p-2.5 text-slate-400 hover:text-primary hover:bg-[var(--bg-card)] rounded-xl transition-all shadow-sm group-hover:shadow-md border border-transparent hover:border-[var(--border-subtle)]"
                                                        title="عرض التفاصيل"
                                                        aria-label="عرض التفاصيل"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {inv.status !== 'paid' && (
                                                        <button 
                                                            onClick={() => { setSelectedInvoice(inv); setPaymentForm({ amount: inv.balance, method: 'cash', notes: '' }); setShowPaymentModal(true); }}
                                                            className="p-2.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/40 shadow-sm group-hover:shadow-md"
                                                            title="تحصيل دفعة"
                                                            aria-label="تحصيل دفعة"
                                                        >
                                                            <Banknote className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => { setSelectedInvoice(inv); setShowInstallmentsModal(true); }}
                                                        className="p-2.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/40 shadow-sm group-hover:shadow-md"
                                                        title="تقسيط"
                                                        aria-label="تقسيط"
                                                    >
                                                        <CreditCard className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 sm:p-8 bg-[var(--bg-page)]/30 border-t border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">
                        إجمالي {filteredInvoices.length} فواتير معروضة من أصل {invoices.length}
                    </p>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            aria-label="الصفحة السابقة"
                            className="p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-slate-400 hover:text-primary transition-all shadow-sm disabled:opacity-40"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-1.5 px-3">
                            <span className="text-sm font-black text-slate-600 dark:text-slate-300">صفحة {currentPage} من {totalPages}</span>
                        </div>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            aria-label="الصفحة التالية"
                            className="p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-slate-400 hover:text-primary transition-all shadow-sm disabled:opacity-40"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showInvoiceModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
                    <div 
                        ref={invoiceModalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="invoice-modal-title"
                        className="bg-[var(--bg-card)] rounded-[2.5rem] w-full max-w-5xl shadow-2xl border border-[var(--border-color)] overflow-hidden animate-in zoom-in-95 duration-300 my-auto"
                    >
                        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
                            <h2 id="invoice-modal-title" className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3 font-display">
                                <div className="w-2.5 h-10 bg-primary rounded-full" />
                                إنشاء فاتورة جديدة
                            </h2>
                            <button onClick={() => { setShowInvoiceModal(false); setInvoiceNavigationInit(null); }} aria-label="إغلاق" className="p-2 hover:bg-[var(--bg-page)] rounded-full transition-colors text-slate-400">
                                <X className="w-7 h-7" />
                            </button>
                        </div>
                        <div className="p-4 sm:p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <InvoiceBuilder
                                initialPatient={invoiceNavigationInit?.patientId ? { id: invoiceNavigationInit.patientId, fullName: invoiceNavigationInit.patientName ?? '' } : undefined}
                                onSubmit={handleCreateInvoice}
                                onCancel={() => { setShowInvoiceModal(false); setInvoiceNavigationInit(null); }}
                                saving={saving}
                            />
                        </div>
                    </div>
                </div>
            )}

            {showPaymentModal && selectedInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div 
                        ref={paymentModalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="payment-modal-title"
                        className="bg-[var(--bg-card)] rounded-[2.5rem] w-full max-w-md shadow-2xl border border-[var(--border-color)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col"
                    >
                        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
                            <h2 id="payment-modal-title" className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3 font-display">
                                <div className="w-2.5 h-10 bg-emerald-500 rounded-full" />
                                تحصيل دفعة
                            </h2>
                            <button onClick={() => setShowPaymentModal(false)} aria-label="إغلاق" className="p-2 hover:bg-[var(--bg-page)] rounded-full transition-colors text-slate-400">
                                <X className="w-7 h-7" />
                            </button>
                        </div>
                        <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="bg-[var(--bg-page)] rounded-2xl p-5 space-y-3 border border-[var(--border-subtle)]">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest"><span className="text-slate-400">الفاتورة</span><span className="text-primary">#{selectedInvoice.invoiceNumber}</span></div>
                                <div className="flex justify-between items-center bg-red-500/10 p-4 rounded-xl mt-2 border border-red-500/10">
                                    <span className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-widest">المبلغ المتبقي</span>
                                    <span className="text-2xl font-black text-red-600 dark:text-red-400 font-numbers">{formatCurrency(selectedInvoice.balance)}</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="payment-amount" className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block mr-1">المبلغ المراد سداده</label>
                                    <input
                                        id="payment-amount"
                                        type="number"
                                        value={paymentForm.amount}
                                        onChange={(e) => setPaymentForm(p => ({ ...p, amount: Number(e.target.value) }))}
                                        className="w-full bg-[var(--bg-page)] border border-transparent rounded-2xl px-5 py-4 text-xl font-black text-[var(--text-primary)] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/20 transition-all font-display"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="payment-method" className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block mr-1">طريقة الدفع</label>
                                    <select
                                        id="payment-method"
                                        value={paymentForm.method}
                                        onChange={(e) => setPaymentForm(p => ({ ...p, method: e.target.value as PaymentMethodDTO }))}
                                        className="w-full bg-[var(--bg-page)] border border-transparent rounded-2xl px-5 py-4 font-bold text-[var(--text-primary)] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/20 transition-all cursor-pointer appearance-none"
                                    >
                                        {Object.entries(PAYMENT_METHOD_MAP).map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="payment-notes" className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block mr-1">ملاحظات إضافية</label>
                                    <input
                                        id="payment-notes"
                                        value={paymentForm.notes}
                                        onChange={(e) => setPaymentForm(p => ({ ...p, notes: e.target.value }))}
                                        className="w-full bg-[var(--bg-page)] border border-transparent rounded-2xl px-5 py-4 font-bold text-[var(--text-primary)] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/20 transition-all placeholder:text-slate-300"
                                        placeholder="ذكر سبب الدفعة أو تفاصيل أخرى..."
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 sm:p-8 bg-[var(--bg-card)] border-t border-[var(--border-subtle)] flex flex-col sm:flex-row gap-4">
                            <button onClick={() => setShowPaymentModal(false)} className="w-full sm:flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-2xl font-black transition-all hover:bg-slate-200 uppercase text-xs tracking-widest">إلغاء</button>
                            <button
                                onClick={handleAddPayment}
                                disabled={saving}
                                className="w-full sm:flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 dark:shadow-none hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
                            >
                                {saving ? <><Loader2 aria-hidden="true" className="w-5 h-5 animate-spin" /><span className="sr-only">جاري الحفظ...</span></> : <CheckCircle2 className="w-5 h-5" />}
                                تأكيد التحصيل
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showInstallmentsModal && selectedInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
                    <div 
                        ref={installmentsModalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="installments-modal-title"
                        className="bg-[var(--bg-card)] rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden animate-in zoom-in-95 duration-300 my-auto flex flex-col"
                    >
                        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
                            <h2 id="installments-modal-title" className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3 font-display">
                                <div className="w-2.5 h-10 bg-indigo-500 rounded-full" />
                                إدارة أقساط الفاتورة #{selectedInvoice.invoiceNumber}
                            </h2>
                            <button onClick={() => setShowInstallmentsModal(false)} aria-label="إغلاق" className="p-2 hover:bg-[var(--bg-page)] rounded-full transition-colors text-slate-400">
                                <X className="w-7 h-7" />
                            </button>
                        </div>
                        <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto custom-scrollbar flex-1">
                            <InstallmentManager
                                invoiceId={selectedInvoice.id}
                                patientId={selectedInvoice.patientId}
                                invoiceTotal={selectedInvoice.balance}
                            />
                        </div>
                        <div className="p-6 sm:p-8 bg-[var(--bg-card)] border-t border-[var(--border-subtle)]">
                            <button onClick={() => setShowInstallmentsModal(false)} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-all uppercase text-xs tracking-widest border border-[var(--border-subtle)]">
                                العودة للقائمة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Template */}
            {selectedInvoice && (
                <InvoicePrintTemplate
                    invoice={selectedInvoice}
                    clinicName={settings?.clinicName ?? 'العيادة'}
                    doctorName={settings?.doctorName ?? ''}
                    phone={settings?.phone ?? ''}
                    address={settings?.address ?? ''}
                />
            )}
        </div>
    );
}
