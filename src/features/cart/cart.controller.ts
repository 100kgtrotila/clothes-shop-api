import type { Request, Response } from "express";
import { addCartItemSchema, updateCartItemSchema } from "./cart.schema.js";
import cartService from "./cart.service.js";

export class CartController {
	async addItem(req: Request, res: Response) {
		const { body } = addCartItemSchema.parse(req);
		const userId = req.user.id;
		const result = await cartService.addItem(userId, body);
		res.status(201).json({
			success: true,
			data: result,
		});
	}

	async getItems(req: Request, res: Response) {
		const userId = req.user.id;
		const result = await cartService.getUserCart(userId);
		res.status(200).json({
			success: true,
			data: result,
		});
	}

	async updateItem(req: Request, res: Response) {
		const userId = req.user.id;
		const { body } = updateCartItemSchema.parse(req);
		const { productId } = req.params as { productId: string };

		const result = await cartService.updateItem(userId, body, productId);
		res.status(200).json({
			success: true,
			data: result,
		});
	}

	async deleteItem(req: Request, res: Response) {
		const userId = req.user.id;
		const { productId } = req.params as { productId: string };
		await cartService.deleteItem(userId, productId);
		res.status(204).json({
			success: true,
		});
	}
}

export default new CartController();
