import { z } from "zod";
import { OrderStatus } from "../../generated/enums.js";

export const getOrdersSchema = z.object({
	query: z.object({
		page: z.coerce.number().int().positive().default(1),
		limit: z.coerce.number().int().positive().max(100).default(10),
	}),
});

export const updateOrderSchema = z.object({
	params: z.object({
		id: z.uuid(),
	}),
	body: z.object({
		status: z.enum(OrderStatus),
	}),
});

export const orderParamsSchema = z.object({
	params: z.object({
		id: z.uuid(),
	}),
});

export type UpdateOrderDto = z.infer<typeof updateOrderSchema>["body"];
export type OrderParamsDto = z.infer<typeof orderParamsSchema>["params"];
