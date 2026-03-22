import { prisma } from "../../db/prisma.js";
import { ConflictError, NotFoundError } from "../../errors/app.error.js";
import type {
	CreateCategoryDto,
	UpdateCategoryDto,
} from "./category.schema.js";

export class CategoryService {
	async getAll() {
		return prisma.category.findMany();
	}

	async create(dto: CreateCategoryDto) {
		const exists = await prisma.category.findUnique({
			where: { slug: dto.slug },
		});

		if (exists) {
			throw new ConflictError(`Category with slug ${dto.slug} already exists`);
		}

		return prisma.category.create({ data: dto });
	}

	async update(id: string, dto: UpdateCategoryDto) {
		const exists = await prisma.category.findUnique({
			where: {
				id: id,
			},
		});

		if (!exists) {
			throw new NotFoundError(`Category with id ${id} not found`);
		}

		return prisma.category.update({
			where: { id },
			data: {
				...(dto.name !== undefined && { name: dto.name }),
				...(dto.slug !== undefined && { slug: dto.slug }),
			},
		});
	}

	async delete(id: string) {
		const exists = await prisma.category.findUnique({
			where: { id: id },
		});

		if (!exists) {
			throw new NotFoundError(`Category with id ${id} not found`);
		}

		return prisma.category.delete({
			where: { id: id },
		});
	}
}

export default new CategoryService();
