import { z } from "zod";
import { databaseSchema } from "./generated.schemas";

const InstallmentSchema = databaseSchema.shape.public.shape.Tables.shape.installments.shape.Row;

export type InstallmentDTO = z.infer<typeof InstallmentSchema>;

export const parseInstallment = (data: unknown): InstallmentDTO => {
    return InstallmentSchema.parse(data);
};

export const parseInstallments = (data: unknown): InstallmentDTO[] => {
    return z.array(InstallmentSchema).parse(data || []);
};
