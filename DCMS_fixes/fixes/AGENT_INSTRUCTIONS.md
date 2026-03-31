# 🤖 أمر الـ Agent — دمج إصلاحات DCMS بدقة عالية

## الهدف
دمج 6 ملفات معدّلة في مشروع DCMS دون أي أخطاء أو تكرارات أو تداخلات.

---

## الملفات المطلوب استبدالها (استبدال كامل)

### 1. `src/infrastructure/repositories/billingRepository.ts`
**السبب:** إصلاح race condition في رقم الفاتورة — استبدال المنطق اليدوي بـ RPC.
**الإجراء:** استبدل الملف الأصلي بالكامل بملف `billingRepository.ts` من هذا الـ ZIP.
**التغيير الجوهري:** دالة `getNextInvoiceNumber` تستخدم الآن `supabase.rpc('get_next_invoice_number')` بدلاً من استعلام يدوي.

### 2. `src/infrastructure/clients/auth.ts`
**السبب:** إضافة `resetPasswordForEmail` لاحترام Clean Architecture.
**الإجراء:** استبدل الملف الأصلي بالكامل بملف `auth.ts` من هذا الـ ZIP.
**التغيير الجوهري:** إضافة دالة `export async function resetPasswordForEmail(email: string): Promise<void>` في نهاية الملف.

### 3. `src/presentation/pages/auth/AdminLogin.tsx`
**السبب:** استبدال `supabase.auth.resetPasswordForEmail` المباشر بالدالة من AuthService.
**الإجراء:** استبدل الملف الأصلي بالكامل بملف `AdminLogin.tsx` من هذا الـ ZIP.
**التغيير الجوهري:**
- حُذف `import { supabase } from '../../../infrastructure/clients/supabase'`
- أُضيف `import { resetPasswordForEmail } from '../../../infrastructure/clients/auth'`
- استبدل `await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: ... })` بـ `await resetPasswordForEmail(email.trim())`

### 4. `src/utils/exportUtils.ts`
**السبب:** إضافة حماية من CSV/Excel Injection.
**الإجراء:** استبدل الملف الأصلي بالكامل بملف `exportUtils.ts` من هذا الـ ZIP.
**التغيير الجوهري:** إضافة دالة `sanitizeCell` وتطبيقها على كل الحقول النصية في صفوف التصدير.

### 5. `vercel.json`
**السبب:** إزالة `unsafe-eval` من Content-Security-Policy.
**الإجراء:** استبدل الملف الأصلي بالكامل بملف `vercel.json` من هذا الـ ZIP.
**التغيير الجوهري:** حُذفت `'unsafe-eval'` من قيمة `script-src` في الـ CSP header.

### 6. `.github/workflows/ci.yml`
**السبب:** إضافة Build Check و Security Audit للـ CI pipeline.
**الإجراء:** استبدل الملف الأصلي بالكامل بملف `ci.yml` من هذا الـ ZIP.
**التغيير الجوهري:** إضافة خطوتين في نهاية الـ steps: `npm run build` و `npm audit --audit-level=high`.

### 7. `migrations.sql` (في جذر المشروع)
**السبب:** إصلاح خطأ "policy already exists" وإضافة حماية DoS لـ slot_locks.
**الإجراء:** استبدل الملف الأصلي بالكامل بملف `migrations.sql` من هذا الـ ZIP.
**التغييرات الجوهرية:**
- أُضيف `DROP POLICY IF EXISTS "audit_admin_read" ON audit_logs;` قبل `CREATE POLICY "audit_admin_read"`
- أُضيف قيد `expires_at` على policy `Public insert slot_locks` لمنع DoS

---

## تحقق ما قبل الدمج ✅

قبل الدمج، تحقق من وجود هذه الدوال في المشروع الأصلي (يجب أن تكون موجودة):

```sql
-- في migrations.sql — يجب أن تكون موجودة
CREATE OR REPLACE FUNCTION public.get_next_invoice_number()
```

إذا لم تجد `get_next_invoice_number` في migrations.sql الأصلي، ابحث عنها في ملفات `supabase/migrations/` — قد تكون في ملف منفصل. في كل الأحوال، الـ RPC موجود وجاهز لأن migrations.sql الأصلي يُنشئه.

---

## تحقق ما بعد الدمج ✅

بعد الدمج، تحقق من:

1. **billingRepository.ts** — ابحث عن `rpc('get_next_invoice_number')` يجب أن يكون موجوداً.
2. **AdminLogin.tsx** — ابحث عن `supabase.auth.resetPasswordForEmail` يجب أن **لا** يكون موجوداً في هذا الملف.
3. **auth.ts** — ابحث عن `export async function resetPasswordForEmail` يجب أن يكون موجوداً.
4. **vercel.json** — ابحث عن `unsafe-eval` يجب أن **لا** يكون موجوداً.
5. **ci.yml** — ابحث عن `npm run build` يجب أن يكون موجوداً في الـ steps.
6. **migrations.sql** — ابحث عن `DROP POLICY IF EXISTS "audit_admin_read"` يجب أن يكون موجوداً.

---

## ملاحظات مهمة ⚠️

- **لا تعدّل** أي ملف آخر غير المذكورين أعلاه.
- **لا تُضف** imports جديدة غير الموجودة في الملفات المُسلَّمة.
- **لا تُغيّر** منطق أي دالة غير المذكورة في قسم "التغيير الجوهري".
- **تأكد** من الحفاظ على ترميز UTF-8 لجميع الملفات (النصوص العربية).
- ملف `migrations.sql` يُشغَّل في **Supabase SQL Editor** — لا تُشغّله تلقائياً.
