import { CacheService } from "@/utils/cache.js";
import { prisma } from "../../db/prisma.js";
import { ConflictError, NotFoundError } from "../../errors/app.error.js";
import type {
	CreateCategoryDto,
	UpdateCategoryDto,
} from "./category.schema.js";

const CACHE_KEYS = {
	all: "categories:all",
} as const;

export class CategoryService {
	private cache = new CacheService(86400);

	async getAll() {
		return this.cache.getOrSet(CACHE_KEYS.all, () => {
			return prisma.category.findMany({
				orderBy: { name: "asc" },
			});
		});
	}

	async create(dto: CreateCategoryDto) {
		const exists = await prisma.category.findUnique({
			where: { slug: dto.slug },
		});

		if (exists) {
			throw new ConflictError(`Category with slug ${dto.slug} already exists`);
		}

		const category = prisma.category.create({ data: dto });

		await this.cache.del(CACHE_KEYS.all);
		return category;
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

		if (dto.slug && dto.slug !== exists.slug) {
			const slugTaken = await prisma.category.findUnique({
				where: { slug: dto.slug },
			});

			if (slugTaken) {
				throw new ConflictError(
					`Category with slug ${dto.slug} already exists`,
				);
			}

			const updated = prisma.category.update({
				where: { id },
				data: {
					...(dto.name !== undefined && { name: dto.name }),
					...(dto.slug !== undefined && { slug: dto.slug }),
				},
			});

			await this.cache.del(CACHE_KEYS.all);

			return updated;
		}
	}

	async delete(id: string) {
		const exists = await prisma.category.findUnique({
			where: { id: id },
		});

		if (!exists) {
			throw new NotFoundError(`Category with id ${id} not found`);
		}

		await prisma.category.delete({
			where: { id: id },
		});

		await this.cache.del(CACHE_KEYS.all);
	}
}

export default new CategoryService();
