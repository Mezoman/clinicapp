import { z } from "zod";
import { databaseSchema } from "./generated.schemas";

const SlotLockRowSchema = databaseSchema.shape.public.shape.Tables.shape.slot_locks.shape.Row;

export type SlotLockRowDTO = z.infer<typeof SlotLockRowSchema>;

export const parseSlotLock = (data: unknown): SlotLockRowDTO => {
    return SlotLockRowSchema.parse(data);
};
