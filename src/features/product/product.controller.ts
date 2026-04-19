import type { Request, Response } from "express";
import {
	type CreateProductDto,
	deleteProductSchema,
	getProductsSchema,
	type ProductParamsDto,
	updateProductSchema,
} from "./product.schema.js";
import productService from "./product.service.js";

export class ProductController {
	async getAllProducts(req: Request, res: Response) {
		const { query } = getProductsSchema.parse(req);
		const result = await productService.getAll(query);
		res.status(200).json(result);
	}

	async getProductById(req: Request, res: Response) {
		const { id } = req.params as unknown as ProductParamsDto;
		const result = await productService.getByIdOrSlug(id);
		res.status(200).json({
			success: true,
			data: result,
		});
	}

	async createProduct(req: Request, res: Response) {
		const dto = req.body as CreateProductDto;
		const newProduct = await productService.create(dto);
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

export default new ProductController();
