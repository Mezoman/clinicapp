import { z } from "zod";
import { databaseSchema } from "./generated.schemas";
import type { Gender } from "../../domain/models";

const PatientSchema = databaseSchema.shape.public.shape.Tables.shape.patients.shape.Row;

export const GENDER_ENUM_VALUES = ['male', 'female'] as const;
export const GenderSchema = z.enum(GENDER_ENUM_VALUES);

export type PatientDTO = z.infer<typeof PatientSchema>;

export const parsePatient = (data: unknown): PatientDTO => {
    return PatientSchema.parse(data);
};

export const parsePatients = (data: unknown): PatientDTO[] => {
    return z.array(PatientSchema).parse(data);
};

export const parseGender = (gender: unknown): Gender => {
    return GenderSchema.parse(gender || 'male');
};
