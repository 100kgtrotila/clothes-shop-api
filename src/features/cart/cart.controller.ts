import type { Request, Response } from "express";
import { addItemCartSchema } from "./cart.schema.js";
import cartService from "./cart.service.js";

export class CartController {
	async addItem(req: Request, res: Response) {
		const { body } = addItemCartSchema.parse(req);
		const userId = req.user.id;
		const result = await cartService.addItem(userId, body);
		res.status(201).json({
			success: true,
			data: result,
		});
	}

	async getCartItems(req: Request, res: Response) {
		const userId = req.user.id;
		const result = await cartService.getUserCart(userId);
		res.status(200).json({
			success: true,
			data: result,
		});
	}
}

export default new CartController();
