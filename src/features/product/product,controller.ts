import type { Request, Response } from "express";
import { getProductsSchema } from "./product.schema.js";
import productService from "./product.service.js";

export class productController {
	async getAllProducts(req: Request, res: Response) {
		const { query } = getProductsSchema.parse(req);
		const result = await productService.getAll(query);
		res.json(result);
	}

	async createProduct(req: Request, res: Response) {
		const newProduct = await productService.create(req.body);
		res.status(201).json({
			success: true,
			data: newProduct,
		});
	}
}

export default new productController();
