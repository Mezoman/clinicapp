import { z } from "zod";
import { databaseSchema } from "./generated.schemas";

// Validation for dynamic table names
export const TableNameSchema = z.enum([
    'patients',
    'appointments',
    'invoices',
    'medical_records',
    'settings',
    'audit_logs',
    'slot_locks'
]);

export type ValidTableName = z.infer<typeof TableNameSchema>;

// Safe access to table insert schemas
export const getTableInsertSchema = (tableName: ValidTableName) => {
    return databaseSchema.shape.public.shape.Tables.shape[tableName].shape.Insert;
};

// Response schema for factory reset
export const FactoryResetResponseSchema = z.null().or(z.object({}));
export const parseFactoryResetResponse = (data: unknown) => FactoryResetResponseSchema.parse(data);
