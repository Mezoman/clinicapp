import { z } from "zod";
import { databaseSchema } from "./generated.schemas";
import type { ToothChartEntry } from "../../domain/models";
import type { Json } from "../../database.types";

const MedicalRecordRowSchema = databaseSchema.shape.public.shape.Tables.shape.medical_records.shape.Row;

// Lenient schema for DB responses: Supabase may return null for updated_at on fresh inserts
// before the DB trigger fires. This prevents Zod parse failures on newly created records.
const MedicalRecordResponseSchema = MedicalRecordRowSchema.extend({
    created_at: z.string().nullable().transform(v => v ?? new Date().toISOString()),
    updated_at: z.string().nullable().transform(v => v ?? new Date().toISOString()),
    attachments: z.unknown().nullable().optional(),
}).passthrough();

export const ToothChartStatusSchema = z.enum(['healthy', 'decayed', 'missing', 'filled', 'crowned', 'extracted']);

export const ToothChartEntrySchema = z.object({
    status: ToothChartStatusSchema,
    notes: z.string().optional().nullable()
});

export const TeethChartSchema = z.record(z.string(), ToothChartEntrySchema);

export type MedicalRecordDTO = z.infer<typeof MedicalRecordRowSchema>;
export type TeethChartDTO = z.infer<typeof TeethChartSchema>;

export const parseMedicalRecord = (data: unknown): MedicalRecordDTO => {
    // Use lenient schema — handles null updated_at from fresh Supabase inserts
    return MedicalRecordResponseSchema.parse(data) as MedicalRecordDTO;
};

export const parseMedicalRecords = (data: unknown): MedicalRecordDTO[] => {
    return z.array(MedicalRecordResponseSchema).parse(data) as MedicalRecordDTO[];
};

export const parseTeethChart = (data: unknown): TeethChartDTO => {
    return TeethChartSchema.parse(data || {});
};

export const serializeTeethChart = (chart: Record<string, ToothChartEntry>): Json => {
    return chart as unknown as Json;
};
