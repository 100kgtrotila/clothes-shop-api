import { prisma } from "../../db/prisma.js";
import type { createCategoryDto } from "./category.schema.js";

export class CategoryService {
	async getAll() {
		return prisma.category.findMany();
	}

	async create(data: createCategoryDto) {
		const exists = await prisma.category.findUnique({
			where: { slug: data.slug },
		});

		if (exists) {
			throw new Error(`Category with slug ${data.slug} is already exists`);
		}

		return prisma.category.create({ data });
	}
}

export default new CategoryService();
