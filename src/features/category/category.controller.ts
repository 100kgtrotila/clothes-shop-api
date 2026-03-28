import type { Request, Response } from "express";
import categoryService from "./category.service.js";
import type {
	CategoryParamsDto,
	CreateCategoryDto,
} from "./category.schema.js";

export class CategoryController {
	async getAllCategories(_req: Request, res: Response) {
		const categories = await categoryService.getAll();
		res.status(200).json({
			success: true,
			data: categories,
		});
	}

	async createCategory(req: Request, res: Response) {
		const dto = req.body as CreateCategoryDto;
		const newCategory = await categoryService.create(dto);
		res.status(201).json({ success: true, data: newCategory });
	}

	async updateCategory(req: Request, res: Response) {
		const { id } = req.params as unknown as CategoryParamsDto;
		const result = await categoryService.update(id, req.body);
		res.status(200).json({
			success: true,
			data: result,
		});
	}

	async deleteCategory(req: Request, res: Response) {
		const { id } = req.params as unknown as CategoryParamsDto;
		await categoryService.delete(id);
		res.status(204).send();
	}
}

export default new CategoryController();
