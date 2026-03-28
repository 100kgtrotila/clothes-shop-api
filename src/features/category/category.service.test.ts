import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../db/prisma.js", () => ({
	prisma: {
		category: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

import { prisma } from "../../db/prisma.js";
import { ConflictError, NotFoundError } from "../../errors/app.error.js";
import { CategoryService } from "./category.service.js";

const mockCategory = vi.mocked(prisma.category);

const fakeCategory = {
	id: "cat-1",
	name: "T-Shirts",
	slug: "t-shirts",
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("CategoryService.getAll", () => {
	it("should return all categories", async () => {
		mockCategory.findMany.mockResolvedValue([fakeCategory] as any);

		const service = new CategoryService();
		const result = await service.getAll();

		expect(mockCategory.findMany).toHaveBeenCalledOnce();
		expect(result).toEqual([fakeCategory]);
	});

	it("should return an empty array when no categories exist", async () => {
		mockCategory.findMany.mockResolvedValue([]);

		const service = new CategoryService();
		const result = await service.getAll();

		expect(result).toEqual([]);
	});
});

describe("CategoryService.create", () => {
	it("should create a new category when slug is unique", async () => {
		mockCategory.findUnique.mockResolvedValue(null);
		mockCategory.create.mockResolvedValue(fakeCategory as any);

		const service = new CategoryService();
		const result = await service.create({ name: "T-Shirts", slug: "t-shirts" });

		expect(mockCategory.create).toHaveBeenCalledWith({
			data: { name: "T-Shirts", slug: "t-shirts" },
		});
		expect(result).toEqual(fakeCategory);
	});

	it("should throw ConflictError when slug already exists", async () => {
		mockCategory.findUnique.mockResolvedValue(fakeCategory as any);

		const service = new CategoryService();
		await expect(
			service.create({ name: "T-Shirts", slug: "t-shirts" }),
		).rejects.toThrow(ConflictError);
		await expect(
			service.create({ name: "T-Shirts", slug: "t-shirts" }),
		).rejects.toThrow("Category with slug t-shirts already exists");
	});
});

describe("CategoryService.update", () => {
	it("should throw NotFoundError when category does not exist", async () => {
		mockCategory.findUnique.mockResolvedValue(null);

		const service = new CategoryService();
		await expect(
			service.update("cat-missing", { name: "New Name" }),
		).rejects.toThrow(NotFoundError);
	});

	it("should throw ConflictError when the new slug is taken by another category", async () => {
		mockCategory.findUnique
			.mockResolvedValueOnce(fakeCategory as any) // exists check
			.mockResolvedValueOnce({ id: "cat-2", slug: "jeans" } as any); // slug taken

		const service = new CategoryService();
		await expect(
			service.update("cat-1", { slug: "jeans" }),
		).rejects.toThrow(ConflictError);
	});

	it("should update and return the category when slug is new and available", async () => {
		const updatedCategory = { ...fakeCategory, slug: "new-slug" };
		mockCategory.findUnique
			.mockResolvedValueOnce(fakeCategory as any) // exists
			.mockResolvedValueOnce(null); // new slug not taken
		mockCategory.update.mockResolvedValue(updatedCategory as any);

		const service = new CategoryService();
		const result = await service.update("cat-1", { slug: "new-slug" });

		expect(mockCategory.update).toHaveBeenCalledWith({
			where: { id: "cat-1" },
			data: { slug: "new-slug" },
		});
		expect(result).toEqual(updatedCategory);
	});

	it("should return undefined when the slug is unchanged (no-op path)", async () => {
		// When dto.slug equals the existing slug, the update block is skipped
		mockCategory.findUnique.mockResolvedValueOnce(fakeCategory as any);

		const service = new CategoryService();
		const result = await service.update("cat-1", { slug: "t-shirts" });

		expect(mockCategory.update).not.toHaveBeenCalled();
		expect(result).toBeUndefined();
	});
});

describe("CategoryService.delete", () => {
	it("should delete the category when it exists", async () => {
		mockCategory.findUnique.mockResolvedValue(fakeCategory as any);
		mockCategory.delete.mockResolvedValue(fakeCategory as any);

		const service = new CategoryService();
		const result = await service.delete("cat-1");

		expect(mockCategory.delete).toHaveBeenCalledWith({
			where: { id: "cat-1" },
		});
		expect(result).toEqual(fakeCategory);
	});

	it("should throw NotFoundError when category does not exist", async () => {
		mockCategory.findUnique.mockResolvedValue(null);

		const service = new CategoryService();
		await expect(service.delete("cat-missing")).rejects.toThrow(NotFoundError);
		await expect(service.delete("cat-missing")).rejects.toThrow(
			"Category with id cat-missing not found",
		);
	});
});
