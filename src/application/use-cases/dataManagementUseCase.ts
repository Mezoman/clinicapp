import { logger } from '../../utils/logger';
import { dataRepository } from '../../infrastructure/repositories/dataRepository';

// ═══════════════════════════════════════════════
// Data Management Service (Backup & Restore - Repository Abstraction)
// ═══════════════════════════════════════════════

const TABLES_TO_MANAGE = [
    'patients',
    'appointments',
    'medical_records',
    'invoices',
    'settings',
];

/**
 * Exports all primary tables to a single JSON object
 */
export async function exportDatabase(): Promise<string> {
    const data = await dataRepository.exportTables(TABLES_TO_MANAGE);

    return JSON.stringify({
        version: 'supabase-1.0',
        timestamp: new Date().toISOString(),
        data
    }, null, 2);
}

/**
 * Imports data from a JSON backup.
 */
export async function importDatabase(jsonString: string): Promise<void> {
    const backup = JSON.parse(jsonString);
    if (!backup.data) throw new Error('Invalid backup format');

    await dataRepository.importTables(backup.data);
}

/**
 * Deletes all sensitive business data.
 */
export async function factoryReset(): Promise<void> {
    try {
        await dataRepository.factoryReset();
    } catch (error) {
        logger.error('Factory Reset Error:', error);
        throw error;
    }
}
