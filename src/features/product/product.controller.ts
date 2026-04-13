import type { Request, Response } from "express";
import {
	deleteProductSchema,
	getProductsSchema,
	type ProductParamsDto,
	updateProductSchema,
} from "./product.schema.js";
import productService from "./product.service.js";

export class productController {
	async getAllProducts(req: Request, res: Response) {
		const { query } = getProductsSchema.parse(req);
		const result = await productService.getAll(query);
		res.json(result).status(200);
	}

	async getProductById(req: Request, res: Response) {
		const { id } = req.params as unknown as ProductParamsDto;
		const result = await productService.getById(id);
		res.status(200).json({
			success: true,
			data: result,
		});
	}

	async createProduct(req: Request, res: Response) {
		const newProduct = await productService.create(req.body);
		res.status(201).json({
			success: true,
			data: newProduct,
		});
	}

	async updateProduct(req: Request, res: Response) {
		const {
			params: { id: productId },
			body,
		} = updateProductSchema.parse(req);
		const result = await productService.update(productId, body);
		res.status(200).json({
			success: true,
			data: result,
		});
	}

	async delete(req: Request, res: Response) {
		const { params } = deleteProductSchema.parse(req);
		await productService.delete(params.id);
		res.status(204).send();
	}
}

export default new productController();
