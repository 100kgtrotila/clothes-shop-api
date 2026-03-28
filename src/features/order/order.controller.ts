import type { Request, Response } from "express";
import orderService from "./order.service.js";
import { type GetMyOrdersDto } from "./order.schema.js";

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
		const orderId = req.params;

		const order = await orderService.orderById(userId, orderId);
	}
}

export default new OrderController();
