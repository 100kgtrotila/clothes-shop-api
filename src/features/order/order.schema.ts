import { z } from "zod";
import { OrderStatus } from "../../generated/enums.js";

export const getAllOrdersSchema = z.object({
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
	body: z
		.object({
			status: z.enum(OrderStatus),
		})
		.strict(),
});

export const createOrderSchema = z.object({
	body: z.object({}).optional(),
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

export type CreateOrderDto = z.infer<typeof createOrderSchema>["body"];
export type GetAllOrdersDto = z.infer<typeof getAllOrdersSchema>["query"];
export type OrderParamsDto = z.infer<typeof getOrderByIdSchema>["params"];
export type UpdateStatusOrderParams = z.infer<
	typeof updateStatusOrderSchema
>["params"];
export type UpdateStatusOrderBody = z.infer<
	typeof updateStatusOrderSchema
>["body"];
export type GetMyOrdersDto = z.infer<typeof getMyOrdersSchema>["query"];
