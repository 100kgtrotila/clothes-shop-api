import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTx = {
	product: { update: vi.fn() },
	productCategory: { deleteMany: vi.fn(), createMany: vi.fn() },
};

vi.mock("../../db/prisma.js", () => ({
	prisma: {
		product: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			count: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		productCategory: {
			deleteMany: vi.fn(),
			createMany: vi.fn(),
		},
		$transaction: vi.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
	},
}));

import { prisma } from "../../db/prisma.js";
import { NotFoundError } from "../../errors/app.error.js";
import { ProductService } from "./product.service.js";

const mockProduct = vi.mocked(prisma.product);

const fakeProduct = {
	id: "prod-1",
	name: "Blue Jeans",
	description: "Nice jeans",
	price: 5000,
	stock: 10,
};

const fakeProductWithCategories = {
	...fakeProduct,
	categories: [{ category: { id: "cat-1", name: "Jeans", slug: "jeans" } }],
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("ProductService.getAll", () => {
	it("should return paginated products without a category filter", async () => {
		mockProduct.findMany.mockResolvedValue([fakeProduct] as any);
		mockProduct.count.mockResolvedValue(1);

		const service = new ProductService();
		const result = await service.getAll({ page: 1, limit: 10 });

		expect(mockProduct.findMany).toHaveBeenCalledWith({
			skip: 0,
			take: 10,
			where: {},
		});
		expect(result).toEqual({
			items: [fakeProduct],
			total: 1,
			page: 1,
			limit: 10,
			totalPages: 1,
		});
	});

	it("should filter by categoryId when provided", async () => {
		mockProduct.findMany.mockResolvedValue([fakeProduct] as any);
		mockProduct.count.mockResolvedValue(1);

		const service = new ProductService();
		await service.getAll({ page: 1, limit: 5, categoryId: "cat-1" });

		expect(mockProduct.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { categories: { some: { categoryId: "cat-1" } } },
			}),
		);
	});

	it("should calculate the correct page offset", async () => {
		mockProduct.findMany.mockResolvedValue([]);
		mockProduct.count.mockResolvedValue(25);

		const service = new ProductService();
		const result = await service.getAll({ page: 3, limit: 10 });

		expect(mockProduct.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ skip: 20, take: 10 }),
		);
		expect(result.totalPages).toBe(3);
	});
});

describe("ProductService.getById", () => {
	it("should return the product with its categories", async () => {
		mockProduct.findUnique.mockResolvedValue(fakeProductWithCategories as any);

		const service = new ProductService();
		const result = await service.getById("prod-1");

		expect(mockProduct.findUnique).toHaveBeenCalledWith({
			where: { id: "prod-1" },
			include: { categories: { include: { category: true } } },
		});
		expect(result).toEqual(fakeProductWithCategories);
	});

	it("should throw NotFoundError when product does not exist", async () => {
		mockProduct.findUnique.mockResolvedValue(null);

		const service = new ProductService();
		await expect(service.getById("prod-missing")).rejects.toThrow(
			NotFoundError,
		);
	});
});

describe("ProductService.create", () => {
	it("should create a product with category associations", async () => {
		mockProduct.create.mockResolvedValue(fakeProductWithCategories as any);

		const service = new ProductService();
		const result = await service.create({
			name: "Blue Jeans",
			price: 5000,
			stock: 10,
			description: "Nice jeans",
			categoryIds: ["cat-1"],
		});

		expect(mockProduct.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					name: "Blue Jeans",
					price: 5000,
					categories: {
						create: [{ categoryId: "cat-1" }],
					},
				}),
			}),
		);
		expect(result).toEqual(fakeProductWithCategories);
	});

	it("should set description to null when not provided", async () => {
		mockProduct.create.mockResolvedValue({ ...fakeProduct, description: null } as any);

		const service = new ProductService();
		await service.create({
			name: "Blue Jeans",
			price: 5000,
			categoryIds: ["cat-1"],
		});

		expect(mockProduct.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ description: null }),
			}),
		);
	});
});

describe("ProductService.update", () => {
	it("should throw NotFoundError when the product does not exist", async () => {
		mockProduct.findUnique.mockResolvedValue(null);

		const service = new ProductService();
		await expect(
			service.update("prod-missing", { name: "New Name" }),
		).rejects.toThrow(NotFoundError);
	});

	it("should update product fields without modifying categories", async () => {
		mockProduct.findUnique.mockResolvedValue(fakeProduct as any);
		mockTx.product.update.mockResolvedValue({ ...fakeProduct, name: "Red Jeans" } as any);

		const service = new ProductService();
		await service.update("prod-1", { name: "Red Jeans" });

		expect(mockTx.productCategory.deleteMany).not.toHaveBeenCalled();
		expect(mockTx.product.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "prod-1" },
				data: { name: "Red Jeans" },
			}),
		);
	});

	it("should sync categories when categoryIds are provided", async () => {
		mockProduct.findUnique.mockResolvedValue(fakeProduct as any);
		mockTx.productCategory.deleteMany.mockResolvedValue({} as any);
		mockTx.productCategory.createMany.mockResolvedValue({} as any);
		mockTx.product.update.mockResolvedValue(fakeProduct as any);

		const service = new ProductService();
		await service.update("prod-1", { categoryIds: ["cat-2"] });

		expect(mockTx.productCategory.deleteMany).toHaveBeenCalledWith({
			where: { productId: "prod-1", categoryId: { notIn: ["cat-2"] } },
		});
		expect(mockTx.productCategory.createMany).toHaveBeenCalledWith({
			data: [{ productId: "prod-1", categoryId: "cat-2" }],
			skipDuplicates: true,
		});
	});
});

describe("ProductService.delete", () => {
	it("should delete a product that exists", async () => {
		mockProduct.findUnique.mockResolvedValue(fakeProduct as any);
		mockProduct.delete.mockResolvedValue(fakeProduct as any);

		const service = new ProductService();
		const result = await service.delete("prod-1");

		expect(mockProduct.delete).toHaveBeenCalledWith({ where: { id: "prod-1" } });
		expect(result).toEqual(fakeProduct);
	});

	it("should throw NotFoundError when the product does not exist", async () => {
		mockProduct.findUnique.mockResolvedValue(null);

		const service = new ProductService();
		await expect(service.delete("prod-missing")).rejects.toThrow(NotFoundError);
	});
});
