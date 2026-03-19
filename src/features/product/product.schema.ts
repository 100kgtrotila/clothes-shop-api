import { z } from "zod";

export const createProductSchema = z.object({
	body: z.object({
		name: z.string().min(3),
		description: z.string().min(10).nullish(),
		price: z.number().positive(),
		stock: z.number().int().nonnegative().optional(),
		categoryIds: z.array(z.uuid()).min(1),
	}),
});

export const getProductsSchema = z.object({
	query: z.object({
		page: z.coerce.number().int().positive().default(1),
		limit: z.coerce.number().int().positive().max(100).default(10),
		categoryId: z.uuid().min(1).optional(),
	}),
});

export const updateProductSchema = z.object({
	params: z.object({
		id: z.uuid(),
	}),
	body: createProductSchema.shape.body.partial().strict(),
});

export const deleteProductSchema = z.object({
	params: z.object({
		id: z.uuid(),
	}),
});

export type deleteProductDto = z.infer<typeof deleteProductSchema>["params"];
export type getProductsDto = z.infer<typeof getProductsSchema>["query"];
export type createProductDto = z.infer<typeof createProductSchema>["body"];
export type updateProductDto = z.infer<typeof updateProductSchema>["body"];
