import { supabase } from '../clients/supabase';
import type { Closure } from '../../domain/models';
import { parseClosure, parseClosures, type ClosureDTO } from '../contracts/closure.contract';
import { assertClosureReason } from '../validation/typeGuards';

export class ClosureRepository {
    async getClosures(): Promise<readonly Closure[]> {
        const { data, error } = await supabase
            .from('closures')
            .select('*')
            .order('start_date', { ascending: true });

        if (error) throw error;
        return parseClosures(data).map((row) => this.mapFromDb(row));
    }

    async addClosure(closure: Omit<Closure, 'id' | 'createdAt' | 'updatedAt'>): Promise<Closure> {
        const { data, error } = await supabase
            .from('closures')
            .insert({
                start_date: closure.startDate,
                end_date: closure.endDate,
                reason: closure.reason
            })
            .select()
            .single();

        if (error) throw error;
        return this.mapFromDb(parseClosure(data));
    }

    async deleteClosure(id: string): Promise<void> {
        const { error } = await supabase
            .from('closures')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }

    private mapFromDb(row: ClosureDTO): Closure {
        assertClosureReason(row.reason);
        return {
            id: row.id,
            startDate: row.start_date,
            endDate: row.end_date,
            reason: row.reason,
            createdAt: row.created_at,
            updatedAt: row.created_at  // closures table may not have updated_at
        };
    }
}

export const closureRepository = new ClosureRepository();
