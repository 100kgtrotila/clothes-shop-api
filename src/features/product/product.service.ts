import { prisma } from "../../db/prisma.js";
import type { createProductDto, getProductsDto } from "./product.schema.js";

export class ProductService {
	async getAll(dto: getProductsDto) {
		const { page, limit, categoryId } = dto;
		const skip = (page - 1) * limit;

		const where = categoryId ? { categories: { some: { categoryId } } } : {};

		const [items, total] = await Promise.all([
			prisma.product.findMany({
				skip,
				take: limit,
				where,
			}),
			prisma.product.count({ where }),
		]);

		return {
			items,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async getById(id: string) {
		const product = await prisma.product.findUnique({
			where: { id: id },
			include: {
				categories: {
					include: { category: true },
				},
			},
		});

		if (!product) {
			throw new Error(`Product with id ${id} not found!`);
		}

		return product;
	}

	async create(dto: createProductDto) {
		const { categoryIds, stock, description, ...productData } = dto;

		return prisma.product.create({
			data: {
				...productData,
				description: description ?? null,
				...(stock !== undefined && { stock }),
				categories: {
					create: categoryIds.map((categoryId) => ({ categoryId })),
				},
			},
			include: {
				categories: {
					include: { category: true },
				},
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
