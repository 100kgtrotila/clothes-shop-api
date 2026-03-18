import { z } from "zod";

export const addItemCartSchema = z.object({
	body: z.object({
		cartId: z.uuid(),
		productId: z.uuid(),
		quantity: z.number().positive(),
	}),
});

export type createCartItemSchemaDto = z.infer<typeof addItemCartSchema>["body"];
