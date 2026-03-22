import { z } from "zod";

export const createCategorySchema = z.object({
	body: z.object({
		name: z.string().min(2),
		slug: z.string().regex(/^[a-z0-9-]+$/),
	}),
});

export const updateCategorySchema = z.object({
	params: z.object({
		id: z.uuid(),
	}),
	body: createCategorySchema.shape.body.partial(),
});

export const deleteCategorySchema = z.object({
	params: z.object({
		id: z.uuid(),
	}),
});

export type createCategoryDto = z.infer<typeof createCategorySchema>["body"];
export type updateCategoryDto = z.infer<typeof updateCategorySchema>["body"];
export type deleteCategoryDto = z.infer<typeof deleteCategorySchema>["params"];
