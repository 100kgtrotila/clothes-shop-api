import { z } from "zod";

export const createProductSchema = z.object({
	body: z.object({
		name: z.string().min(3),
		description: z.string().min(10).nullish(),
		price: z.number().int().positive(),
		stock: z.number().int().nonnegative().optional(),
		images: z.array(z.url()).optional().default([]),
		categoryIds: z.array(z.uuid()).min(1),
	}),
});

export const getProductsSchema = z.object({
	query: z.object({
		page: z.coerce.number().int().positive().default(1),
		limit: z.coerce.number().int().positive().max(100).default(10),
		search: z.string().optional(),
		categoryId: z.uuid().min(1).optional(),
		minPrice: z.coerce.number().nonnegative().optional(),
		maxPrice: z.coerce.number().nonnegative().optional(),
		sortBy: z.enum(["price", "createdAt", "name"]).default("createdAt"),
		sortOrder: z.enum(["desc", "asc"]).default("desc"),
	}),
});

export const getProductByIdSchema = z.object({
	params: z.object({
		id: z.uuid(),
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

export type ProductParamsDto = z.infer<typeof getProductByIdSchema>["params"];
export type GetProductsDto = z.infer<typeof getProductsSchema>["query"];
export type CreateProductDto = z.infer<typeof createProductSchema>["body"];
export type UpdateProductDto = z.infer<typeof updateProductSchema>["body"];
