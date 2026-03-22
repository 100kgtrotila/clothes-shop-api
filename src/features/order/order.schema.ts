import { z } from "zod";
import { OrderStatus } from "../../generated/enums.js";

export const Test = z.object({
	query: z.object({
		page: z.coerce.number().int().positive().default(1),
		limit: z.coerce.number().int().positive().max(100).default(10),
		status: z.enum(OrderStatus).optional(),
	}),
});

export const getMyOrdersSchema = z.object({
	query: z.object({
		page: z.coerce.number().int().positive().default(1),
		limit: z.coerce.number().int().positive().max(100).default(10),
		status: z.enum(OrderStatus).optional(),
	}),
});

export const updateStatusOrderSchema = z.object({
	params: z.object({
		id: z.uuid(),
	}),
	body: z.object({
		status: z.enum(OrderStatus),
	}),
});

export const cancelOrderSchema = z.object({
	params: z.object({
		id: z.uuid(),
	}),
});

export const getOrderByIdSchema = z.object({
	params: z.object({
		id: z.uuid(),
	}),
});

export type OrderParamsDto = z.infer<typeof getOrderByIdSchema>["params"];
export type UpdateStatusOrderDto = z.infer<
	typeof updateStatusOrderSchema
>["body"];
export type GetMyOrdersDto = z.infer<typeof getMyOrdersSchema>["query"];
export type GetOrdersDto = z.infer<typeof Test>["query"];
