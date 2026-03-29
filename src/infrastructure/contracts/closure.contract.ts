import { z } from "zod";
import { databaseSchema } from "./generated.schemas";

const ClosureSchema = databaseSchema.shape.public.shape.Tables.shape.closures.shape.Row;

export type ClosureDTO = z.infer<typeof ClosureSchema>;

export const parseClosure = (data: unknown): ClosureDTO => {
    return ClosureSchema.parse(data);
};

export const parseClosures = (data: unknown): ClosureDTO[] => {
    return z.array(ClosureSchema).parse(data || []);
};
