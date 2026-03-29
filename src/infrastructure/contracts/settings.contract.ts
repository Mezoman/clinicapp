import { z } from "zod";
import { databaseSchema } from "./generated.schemas";
import type { ClinicShifts } from "../../domain/models";
import type { Json } from "../../database.types";

const SettingsSchema = databaseSchema.shape.public.shape.Tables.shape.settings.shape.Row;

export const ClinicShiftsSchema = z.object({
    morningStart: z.string(),
    morningEnd: z.string(),
    eveningStart: z.string(),
    eveningEnd: z.string(),
    isEnabled: z.boolean()
});

export type SettingsDTO = z.infer<typeof SettingsSchema>;
export type ClinicShiftsDTO = z.infer<typeof ClinicShiftsSchema>;

export const parseSettings = (data: unknown): SettingsDTO => {
    return SettingsSchema.parse(data);
};

export const parseClinicShifts = (data: unknown): ClinicShiftsDTO => {
    return ClinicShiftsSchema.parse(data);
};

export const serializeClinicShifts = (shifts: ClinicShifts): Json => {
    return shifts as unknown as Json;
};
