import type { Request, Response } from "express";
import { deleteProductSchema, getProductsSchema } from "./product.schema.js";
import productService from "./product.service.js";

export class productController {
	async getAllProducts(req: Request, res: Response) {
		const { query } = getProductsSchema.parse(req);
		const result = await productService.getAll(query);
		res.json(result).status(200);
	}

	async getProductById(req: Request, res: Response) {
		const { id } = req.params as { id: string };
		const result = await productService.getById(id);
		res.json(result).status(200);
	}

	async createProduct(req: Request, res: Response) {
		const newProduct = await productService.create(req.body);
		res.status(201).json({
			success: true,
			data: newProduct,
		});
	}

	async delete(req: Request, res: Response) {
		const { params } = deleteProductSchema.parse(req);
		await productService.delete(params.id);
		res.status(204).send();
	}
}

export default new productController();
