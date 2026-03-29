import { supabase } from '../clients/supabase';
import { ClinicService } from '../../domain/models/service';
import { AppError, ErrorCode } from '../../lib/errors';

export class ServiceRepository {
    async getAll(): Promise<readonly ClinicService[]> {
        const { data, error } = await supabase
            .from('clinic_services')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw new AppError(error.message, ErrorCode.INTERNAL_ERROR);

        return (data || []).map(this.mapFromDb);
    }

    async create(service: Omit<ClinicService, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClinicService> {
        const { data, error } = await supabase
            .from('clinic_services')
            .insert({
                name: service.name,
                name_en: service.nameEn,
                icon: service.icon,
                description: service.description || null,
                default_price: service.defaultPrice,
                is_active: service.isActive
            })
            .select()
            .single();

        if (error) throw new AppError(error.message, ErrorCode.INTERNAL_ERROR);
        return this.mapFromDb(data);
    }

    async update(id: string, updates: Partial<Omit<ClinicService, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ClinicService> {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.nameEn !== undefined) dbUpdates.name_en = updates.nameEn;
        if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
        if (updates.description !== undefined) dbUpdates.description = updates.description || null;
        if (updates.defaultPrice !== undefined) dbUpdates.default_price = updates.defaultPrice;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

        dbUpdates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('clinic_services')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new AppError(error.message, ErrorCode.INTERNAL_ERROR);
        return this.mapFromDb(data);
    }

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('clinic_services')
            .delete()
            .eq('id', id);

        if (error) throw new AppError(error.message, ErrorCode.INTERNAL_ERROR);
    }

    private mapFromDb(row: any): ClinicService {
        return {
            id: row.id,
            name: row.name,
            nameEn: row.name_en,
            icon: row.icon,
            description: row.description || '',
            defaultPrice: Number(row.default_price),
            isActive: row.is_active,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}

export const serviceRepository = new ServiceRepository();
