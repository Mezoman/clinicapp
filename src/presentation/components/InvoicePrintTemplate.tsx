import { memo } from 'react';
import type { InvoiceDTO, InvoiceServiceDTO } from '../../application/dtos/billing.dto';

interface Props {
    invoice: InvoiceDTO;
    clinicName: string;
    doctorName: string;
    phone: string;
    address: string;
}

const InvoicePrintTemplate = memo(function InvoicePrintTemplate({ invoice, clinicName, doctorName, phone, address }: Props) {
    return (
        <div id="invoice-print" className="hidden print:block font-sans text-gray-900 p-8 max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
                <h1 className="text-2xl font-bold">{clinicName}</h1>
                <p className="text-sm text-gray-600">{doctorName}</p>
                <p className="text-sm text-gray-600">{address} | {phone}</p>
            </div>

            {/* Invoice Info */}
            <div className="flex justify-between mb-6">
                <div>
                    <p className="text-sm text-gray-500">رقم الفاتورة</p>
                    <p className="font-bold text-lg">{invoice.invoiceNumber}</p>
                </div>
                <div className="text-left">
                    <p className="text-sm text-gray-500">التاريخ</p>
                    <p className="font-bold">{invoice.invoiceDate}</p>
                </div>
            </div>

            {/* Services Table */}
            <table className="w-full mb-6 border-collapse">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-right text-sm">الخدمة</th>
                        <th className="border border-gray-300 p-2 text-center text-sm">الكمية</th>
                        <th className="border border-gray-300 p-2 text-center text-sm">السعر</th>
                        <th className="border border-gray-300 p-2 text-center text-sm">الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.services?.map((svc: InvoiceServiceDTO, i: number) => (
                        <tr key={i}>
                            <td className="border border-gray-300 p-2 text-sm">{svc.name}</td>
                            <td className="border border-gray-300 p-2 text-center text-sm">{svc.quantity}</td>
                            <td className="border border-gray-300 p-2 text-center text-sm">{svc.unitPrice} ج.م</td>
                            <td className="border border-gray-300 p-2 text-center text-sm">{svc.total} ج.م</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
                <div className="w-48 space-y-1">
                    <div className="flex justify-between text-sm">
                        <span>المجموع الفرعي:</span>
                        <span>{invoice.subtotal} ج.م</span>
                    </div>
                    {invoice.taxAmount && invoice.taxAmount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span>الضريبة ({invoice.taxRate}%):</span>
                            <span>{invoice.taxAmount} ج.م</span>
                        </div>
                    )}
                    {invoice.discount > 0 && (
                        <div className="flex justify-between text-sm text-red-600">
                            <span>الخصم:</span>
                            <span>- {invoice.discount} ج.م</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t pt-1">
                        <span>الإجمالي النهائي:</span>
                        <span>{invoice.total} ج.م</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-700">
                        <span>المدفوع:</span>
                        <span>{invoice.totalPaid} ج.م</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-700 font-bold">
                        <span>المتبقي:</span>
                        <span>{invoice.balance} ج.م</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-xs text-gray-400 border-t pt-4">
                <p>شكراً لثقتكم — {clinicName}</p>
            </div>
        </div>
    );
});

export default InvoicePrintTemplate;
