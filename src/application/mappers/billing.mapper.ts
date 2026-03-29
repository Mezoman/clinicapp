import { Invoice } from '../../domain/models/billing';
import { InvoiceDTO } from '../dtos/billing.dto';

export class BillingMapper {
    static toInvoiceDTO(invoice: Invoice): InvoiceDTO {
        const { patientName, notes, ...rest } = invoice.toProps();
        return {
            ...rest,
            patientName: patientName ?? undefined,
            notes: notes ?? undefined,
            services: invoice.services.map(s => ({
                serviceId: s.serviceId,
                name: s.name,
                quantity: s.quantity,
                unitPrice: s.unitPrice,
                total: s.total
            }))
        } as InvoiceDTO;
    }
}
