import { z } from "zod";

export const createProductSchema = z.object({
	body: z.object({
		name: z.string().min(3),
		description: z.string().optional(),
		price: z.number().positive(),
		stock: z.number().int().nonnegative().optional(),
		categoryId: z.uuid(),
	}),
});

export type createProductDto = z.infer<typeof createProductSchema>["body"];
