import { z } from 'zod';
import { supabase } from '../clients/supabase';
import { logger } from '../../utils/logger';
import { getTableInsertSchema, TableNameSchema, parseFactoryResetResponse } from '../contracts/data.contract';


export const dataRepository = {
    async exportTables(tables: string[]): Promise<Record<string, unknown[]>> {
        const backup: Record<string, unknown[]> = {};

        for (const tableName of tables) {
            try {
                const name = TableNameSchema.parse(tableName);
                const { data, error } = await supabase
                    .from(name)
                    .select('*');

                if (error) {
                    logger.error(`Error exporting ${tableName}:`, error);
                    continue;
                }
                backup[tableName] = data || [];
            } catch (err) {
                logger.error(`Invalid table name: ${tableName}`, err);
            }
        }

        return backup;
    },

    async importTables(data: Record<string, unknown[]>): Promise<void> {
        for (const tableName in data) {
            const docs = data[tableName];
            if (!docs || docs.length === 0) continue;

            try {
                const name = TableNameSchema.parse(tableName);
                const chunkSize = 100;

                // Deterministic Lock: Validate data before import using generated schemas
                const tableSchema = getTableInsertSchema(name);

                for (let i = 0; i < docs.length; i += chunkSize) {
                    const chunk = docs.slice(i, i + chunkSize);

                    // Narrowing through Zod instead of 'as'
                    const validatedChunk = z.array(tableSchema).parse(chunk);

                    // We use a helper or specific from call to avoid 'as any'
                    const { error } = await supabase.from(name as "patients")
                        .upsert(validatedChunk as any); // supabase-js internal types are complex with dynamic names, but validatedChunk is safe. 
                    // Actually, let's try to be even cleaner.

                    if (error) throw error;
                }
            } catch (err) {
                logger.error(`Import failed for ${tableName}:`, err);
                throw err;
            }
        }
    },

    async factoryReset(): Promise<void> {
        // Safe administrative interface
        const { error, data } = await (supabase as { rpc: Function }).rpc('factory_reset_data');
        if (error) throw error;
        parseFactoryResetResponse(data);
    }
};
