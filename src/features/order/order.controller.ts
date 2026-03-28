import type { Request, Response } from "express";
import orderService from "./order.service.js";
import {
	type GetMyOrdersDto,
	type OrderParamsDto,
	type UpdateStatusOrderBody,
	type UpdateStatusOrderParams,
} from "./order.schema.js";

export class OrderController {
	async cheokoutCart(req: Request, res: Response) {
		const userId = req.user.id;
		const order = await orderService.checkout(userId);
		res.status(201).json({
			status: true,
			data: order,
		});
	}

	async getMyOrders(req: Request, res: Response) {
		const userId = req.user.id;

		const query = req.query as unknown as GetMyOrdersDto;

		const order = await orderService.myOrders(userId, query);
		res.status(200).json({
			success: true,
			data: order,
		});
	}

	async getOrderById(req: Request, res: Response) {
		const userId = req.user.id;
		const orderId = req.params as unknown as OrderParamsDto;

		const order = await orderService.orderById(userId, orderId);

		res.status(200).json({
			success: true,
			data: order,
		});
	}

	async UpdateOrderStatus(req: Request, res: Response) {
		const { id } = req.params as unknown as UpdateStatusOrderParams;
		const dto = req.body as UpdateStatusOrderBody;

		const updatedOrder = await orderService.updateStatus(id, dto);
		res.status(200).json({
			success: true,
			data: updatedOrder,
		});
	}
}

export default new OrderController();
