import { z } from "zod";

export const createCategorySchema = z.object({
	body: z.object({
		name: z.string().min(2),
		slug: z.string().regex(/^[a-z0-9-]+$/),
	}),
});

export type createCategoryInput = z.infer<typeof createCategorySchema>["body"];
