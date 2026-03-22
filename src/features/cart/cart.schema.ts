import { z } from "zod";

export const addItemCartSchema = z.object({
	body: z.object({
		productId: z.uuid(),
		quantity: z.number().positive(),
	}),
});

export const deleteItemCartSchema = z.object({
	params: z.object({
		productId: z.uuid(),
	}),
});

export const updateItemCartSchema = z.object({
	params: z.object({
		productId: z.uuid(),
	}),
	body: addItemCartSchema.shape.body.omit({ productId: true }),
});

export type createCartItemDto = z.infer<typeof addItemCartSchema>["body"];
export type deleteItemCartDto = z.infer<typeof deleteItemCartSchema>["params"];
export type updateItemCartDto = z.infer<typeof updateItemCartSchema>["body"];
