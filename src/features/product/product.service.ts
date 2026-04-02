import type { Prisma } from "@/generated/client.js";
import { prisma } from "../../db/prisma.js";
import { NotFoundError } from "../../errors/app.error.js";
import type {
	CreateProductDto,
	GetProductsDto,
	UpdateProductDto,
} from "./product.schema.js";

export class ProductService {
	async getAll(dto: GetProductsDto) {
		const {
			page,
			limit,
			search,
			categoryId,
			minPrice,
			maxPrice,
			sortBy,
			sortOrder,
		} = dto;
		const skip = (page - 1) * limit;
		const take = limit;

		const where: Prisma.ProductWhereInput = {};

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ description: { contains: search, mode: "insensitive" } },
			];
		}

		if (categoryId) {
			where.categories = {
				some: { categoryId: categoryId },
			};
		}

		if (minPrice !== undefined || maxPrice !== undefined) {
			where.price = {};
			if (minPrice !== undefined) where.price.lte = minPrice;
			if (maxPrice !== undefined) where.price.gt = maxPrice;
		}

		const orderBy: Prisma.ProductOrderByWithRelationInput = {
			[sortBy]: sortOrder,
		};

		const [products, total] = await prisma.$transaction([
			prisma.product.findMany({
				where,
				skip,
				take,
				orderBy,
				include: {
					categories: {},
				},
			}),
			prisma.product.count({ where }),
		]);

		const totalPages = Math.ceil(total / limit);

		return {
			data: products,
			meta: {
				total,
				page,
				limit,
				totalPages,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1,
			},
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
			throw new NotFoundError(`Product with id ${id} not found`);
		}

		return product;
	}

	async create(dto: CreateProductDto) {
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

	async update(productId: string, dto: UpdateProductDto) {
		const product = await prisma.product.findUnique({
			where: { id: productId },
		});

		if (!product) {
			throw new NotFoundError(`Product with id ${productId} not found`);
		}

		return prisma.$transaction(async (tx) => {
			if (dto.categoryIds) {
				await tx.productCategory.deleteMany({
					where: { productId, categoryId: { notIn: dto.categoryIds } },
				});

				await tx.productCategory.createMany({
					data: dto.categoryIds.map((categoryId) => ({
						productId,
						categoryId,
					})),
					skipDuplicates: true,
				});
			}

			return tx.product.update({
				where: { id: productId },
				data: {
					...(dto.name !== undefined && { name: dto.name }),
					...(dto.description !== undefined && {
						description: dto.description,
					}),
					...(dto.price !== undefined && { price: dto.price }),
					...(dto.stock !== undefined && { stock: dto.stock }),
				},
			});
		});
	}

	async delete(id: string) {
		const exists = await prisma.product.findUnique({
			where: { id: id },
		});

		if (!exists) {
			throw new NotFoundError(`Product with id ${id} not found`);
		}

		return prisma.product.delete({
			where: { id },
		});
	}
}

export default new ProductService();
