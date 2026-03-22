import { z } from "zod";

export const addCartItemSchema = z.object({
	body: z.object({
		productId: z.uuid(),
		quantity: z.number().int().positive(),
	}),
});

export const updateCartItemSchema = z.object({
	params: z.object({
		productId: z.uuid(),
	}),
	body: addCartItemSchema.shape.body.omit({ productId: true }),
});

export const deleteCartItemSchema = z.object({
	params: z.object({
		productId: z.uuid(),
	}),
});

export type AddCartItemDto = z.infer<typeof addCartItemSchema>["body"];
export type UpdateCartItemDto = z.infer<typeof updateCartItemSchema>["body"];
export type CartItemParamsDto = z.infer<typeof deleteCartItemSchema>["params"];
