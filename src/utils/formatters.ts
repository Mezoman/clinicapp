// ═══════════════════════════════════════════════
// Formatters
// ═══════════════════════════════════════════════

/**
 * Format currency in Egyptian Pounds
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format number with Arabic locale
 */
export function formatNumber(num: number): string {
    return new Intl.NumberFormat('ar-EG').format(num);
}

/**
 * Format phone number for display: 010-XXXX-XXXX
 */
export function formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
}

/**
 * Format phone number for WhatsApp link (with Egypt country code)
 */
export function formatWhatsAppUrl(phone: string, message?: string): string {
    const cleaned = phone.replace(/\D/g, '');
    const international = cleaned.startsWith('0') ? `2${cleaned}` : cleaned;
    const base = `https://wa.me/${international}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}


/**
 * Generate WhatsApp booking confirmation message
 */
export function generateBookingWhatsAppMessage(
    patientName: string,
    date: string,
    time: string | null,
    dailyNumber: number
): string {
    return `مرحباً ${patientName}، تم تأكيد موعدك في عيادة الدكتور محمد أسامة الرفاعي\nالتاريخ: ${date}\nالوقت: ${time || '--:--'}\nرقمك في الطابور: ${dailyNumber}`;
}

/**
 * Capitalize first letter (for English text if any)
 */
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get initials from Arabic name (first and last name)
 */
export function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '';
    if (parts.length === 1) return parts[0].charAt(0);
    const lastName = parts[parts.length - 1];
    return `${parts[0].charAt(0)}${lastName ? lastName.charAt(0) : ''}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, total: number): string {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
}

export interface InvoiceTotals {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
}

export function calculateInvoiceTotals(
  services: { price: number; quantity: number }[],
  discountPercent: number = 0,
  taxPercent: number = 0
): InvoiceTotals {
  const subtotal = services.reduce(
    (sum: number, s: { price: number; quantity: number }) => sum + s.price * s.quantity, 0
  );
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const total = taxableAmount + taxAmount;
  return { subtotal, discountAmount, taxableAmount, taxAmount, total };
}
