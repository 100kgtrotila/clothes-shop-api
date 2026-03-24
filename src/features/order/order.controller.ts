import type { Request, Response } from "express";
import orderService from "./order.service.js";
import { getAuth } from "node_modules/@clerk/express/dist/index.js";

export class OrderController {
	async cheokoutCart(req: Request, res: Response) {
		const userId = req.user.id;

		if (!userId) {
			res.status(401).json({ success: false, message: "Unauthorized" });
			return;
		}

		const order = await orderService.checkout(userId);
		res.status(201).json({
			status: true,
			data: order,
		});
	}
}

export default new OrderController();
