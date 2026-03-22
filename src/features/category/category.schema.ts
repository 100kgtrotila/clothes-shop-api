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
	body: createCategorySchema.shape.body.partial().strict(),
});

export const deleteCategorySchema = z.object({
	params: z.object({
		id: z.uuid(),
	}),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>["body"];
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>["body"];
export type CategoryParamsDto = z.infer<typeof deleteCategorySchema>["params"];
