import { prisma } from "../../db/prisma.js";
import type { createProductDto, getProductsDto } from "./product.schema.js";

export class ProductService {
	async getAll(data: getProductsDto) {
		const { page, limit } = data;
		const skip = (page - 1) * limit;

		const [items, total] = await Promise.all([
			prisma.product.findMany({ skip, take: limit }),
			prisma.product.count(),
		]);

		return {
			items,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async create(data: createProductDto) {
		const existsCategory = await prisma.category.findUnique({
			where: { id: data.categoryId },
		});

		if (!existsCategory) {
			throw new Error(`Category with ${data.categoryId} does not exists`);
		}

		return prisma.product.create({
			data: {
				...data,
				description: data.description ?? null,
				stock: data.stock ?? 0,
			},
		});
	}

	async delete(id: string) {
		const exists = await prisma.product.findUnique({
			where: { id: id },
		});

		if (!exists) {
			throw new Error(`Product with id ${id}, does not exists`);
		}

		return prisma.product.delete({
			where: { id },
		});
	}
}

export default new ProductService();
