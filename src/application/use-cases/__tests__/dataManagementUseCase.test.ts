// src/application/use-cases/__tests__/dataManagementUseCase.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportDatabase, importDatabase, factoryReset } from '../dataManagementUseCase';
import { dataRepository } from '../../../infrastructure/repositories/dataRepository';
import { logger } from '../../../utils/logger';

vi.mock('../../../infrastructure/repositories/dataRepository', () => ({
    dataRepository: {
        exportTables: vi.fn(),
        importTables: vi.fn(),
        factoryReset: vi.fn(),
    }
}));

vi.mock('../../../utils/logger', () => ({
    logger: {
        error: vi.fn(),
    }
}));

describe('dataManagementUseCase', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('exportDatabase', () => {
        it('should return a JSON string of exported data', async () => {
            const mockData = { patients: [{ id: '1' }] };
            vi.mocked(dataRepository.exportTables).mockResolvedValue(mockData);

            const result = await exportDatabase();
            const parsed = JSON.parse(result);

            expect(parsed.version).toBe('supabase-1.0');
            expect(parsed.data).toEqual(mockData);
            expect(dataRepository.exportTables).toHaveBeenCalled();
        });
    });

    describe('importDatabase', () => {
        it('should call importTables with parsed data', async () => {
            const mockBackup = JSON.stringify({ data: { patients: [] } });
            vi.mocked(dataRepository.importTables).mockResolvedValue(undefined);

            await importDatabase(mockBackup);

            expect(dataRepository.importTables).toHaveBeenCalledWith({ patients: [] });
        });

        it('should throw error if backup format is invalid', async () => {
            const invalidBackup = JSON.stringify({ wrong: 'format' });
            await expect(importDatabase(invalidBackup)).rejects.toThrow('Invalid backup format');
        });
    });

    describe('factoryReset', () => {
        it('should call repository factoryReset', async () => {
            vi.mocked(dataRepository.factoryReset).mockResolvedValue(undefined);

            await factoryReset();

            expect(dataRepository.factoryReset).toHaveBeenCalled();
        });

        it('should log error and rethrow if factoryReset fails', async () => {
            const error = new Error('Reset failed');
            vi.mocked(dataRepository.factoryReset).mockRejectedValue(error);

            await expect(factoryReset()).rejects.toThrow('Reset failed');
            expect(logger.error).toHaveBeenCalledWith('Factory Reset Error:', error);
        });
    });
});
