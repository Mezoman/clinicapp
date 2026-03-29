import { z } from "zod";
import { databaseSchema } from "./generated.schemas";

const CMSContentSchema = databaseSchema.shape.public.shape.Tables.shape.landing_content.shape.Row;

export type CMSContentDTO = z.infer<typeof CMSContentSchema>;

export const parseLandingContent = (data: unknown): CMSContentDTO[] => {
    return z.array(CMSContentSchema).parse(data || []);
};
