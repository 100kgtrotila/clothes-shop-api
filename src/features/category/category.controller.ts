import type { Request, Response } from "express";
import categoryService from "./category.service.js";

export class CategoryController {
	async getAllCategories(_req: Request, res: Response) {
		const categories = await categoryService.getAll();
		res.status(200).json({
			success: true,
			data: categories,
		});
	}

	async createCategory(req: Request, res: Response) {
		const newCategory = await categoryService.create(req.body);
		res.status(201).json({ success: true, data: newCategory });
	}
}

export default new CategoryController();
