import type { Patient } from '../domain/models';
import type { InvoiceDTO } from '../application/dtos/billing.dto';
import { supabase } from '../infrastructure/clients/supabase';
import { logger } from './logger';

// ═══════════════════════════════════════════════
// FIXED: CSV/Excel Injection Protection
// أسماء المرضى وأي نص يبدأ بـ = + - @ \t \r
// قد يُنفَّذ كـ formula في Excel — يُمنع بإضافة ' كبادئة
// ═══════════════════════════════════════════════
function sanitizeCell(value: string): string {
    if (!value) return '';
    const firstChar = value[0];
    if (firstChar && ['+', '-', '=', '@', '\t', '\r'].includes(firstChar)) {
        return `'${value}`;
    }
    return value;
}

// تسجيل عملية التصدير في Audit Log
async function logExportAudit(
    exportType: 'invoices' | 'patients',
    recordCount: number,
    filters?: Record<string, unknown>
): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // لا يُصدَّر إلا من قِبل المستخدمين المعتمدين

        // جلب الدور الفعلي من جدول admin_users
        const { data: adminUser } = await supabase
            .from('admin_users')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

        await supabase.from('audit_logs').insert({
            user_id: user.id,
            user_email: user.email ?? 'unknown',
            user_role: adminUser?.role ?? 'admin',
            action: 'export',
            entity_type: exportType,
            entity_id: 'bulk-export',
            new_values: {
                record_count: recordCount,
                export_timestamp: new Date().toISOString(),
                filters: filters ?? {},
            } as any,

        });
    } catch (err) {
        // Audit logging فشل — لا نوقف التصدير بسببه، لكن نسجله في console
        logger.warn('[ExportUtils] Failed to log audit for export:', err as Error);
    }
}

export async function exportInvoicesToExcel(
    invoices: InvoiceDTO[],
    filename = 'تقرير-الفواتير',
    filters?: Record<string, unknown>
) {
    const XLSX = await import('xlsx');
    const rows = invoices.map(inv => ({
        // أرقام الفواتير آمنة (تبدأ بـ INV-) لكن نُعقّمها احتياطاً
        'رقم الفاتورة': sanitizeCell(inv.invoiceNumber ?? ''),
        'التاريخ': sanitizeCell(inv.invoiceDate ?? ''),
        'الإجمالي': inv.total,
        'المدفوع': inv.totalPaid,
        'المتبقي': inv.balance,
        'الحالة': inv.status === 'paid' ? 'مدفوعة'
            : inv.status === 'partial' ? 'جزئي'
                : inv.status === 'issued' ? 'صادرة' : 'ملغاة',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الفواتير');
    ws['!cols'] = [
        { wch: 18 }, { wch: 14 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 },
    ];
    XLSX.writeFile(wb, `${filename}.xlsx`);

    // FIXED: تسجيل عملية التصدير في Audit Log
    await logExportAudit('invoices', invoices.length, filters);
}

export async function exportPatientsToExcel(
    patients: Patient[],
    filename = 'قائمة-المرضى',
    filters?: Record<string, unknown>
) {
    const XLSX = await import('xlsx');
    const rows = patients.map(p => ({
        // FIXED: تطبيق sanitizeCell على كل حقل نصي قد يأتي من إدخال المستخدم
        'الاسم': sanitizeCell(p.fullName ?? ''),
        'رقم الهاتف': sanitizeCell(p.phone ?? ''),
        'تاريخ الميلاد': sanitizeCell(p.birthDate ?? ''),
        'فصيلة الدم': sanitizeCell(p.bloodType ?? ''),
        'النوع': p.gender === 'male' ? 'ذكر' : p.gender === 'female' ? 'أنثى' : '',
        'تاريخ التسجيل': sanitizeCell(p.createdAt?.slice(0, 10) ?? ''),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المرضى');
    ws['!cols'] = [
        { wch: 20 }, { wch: 16 }, { wch: 14 },
        { wch: 12 }, { wch: 10 }, { wch: 14 },
    ];
    XLSX.writeFile(wb, `${filename}.xlsx`);

    // FIXED: تسجيل عملية التصدير في Audit Log
    await logExportAudit('patients', patients.length, filters);
}
