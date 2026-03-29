import { z } from "zod";
import type { Json } from "../../database.types";

export type AuditAction = 'create' | 'update' | 'delete';

const AuditValuesSchema = z.record(z.string(), z.unknown()).nullable();

export const serializeAuditValues = (values: unknown): Json => {
    // We parse to ensure it's a valid object or null, then cast once at the boundary
    const validated = AuditValuesSchema.parse(values ?? null);
    return validated as Json;
};
