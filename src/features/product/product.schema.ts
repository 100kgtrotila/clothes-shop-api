import { z } from "zod";

export const createProductSchema = z.object({
	body: z.object({
		name: z.string().min(3),
		description: z.string().min(10).nullish(),
		price: z.number().positive(),
		stock: z.number().int().nonnegative().optional(),
		categoryId: z.uuid(),
	}),
});

export const getProductsSchema = z.object({
	query: z.object({
		page: z.coerce.number().int().positive().default(1),
		limit: z.coerce.number().int().positive().max(100).default(10),
	}),
});

export type getProductsDto = z.infer<typeof getProductsSchema>["query"];
export type createProductDto = z.infer<typeof createProductSchema>["body"];
