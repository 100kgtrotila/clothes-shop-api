import { beforeEach, describe, expect, it, vi } from "vitest";

// Transaction mock object – shared between the factory and the tests so we can
// assert on its individual methods.
const mockTx = {
	order: { create: vi.fn() },
	product: { update: vi.fn() },
	cartItem: { deleteMany: vi.fn() },
};

vi.mock("../../db/prisma.js", () => ({
	prisma: {
		cart: { findUnique: vi.fn() },
		order: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
		$transaction: vi.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
	},
}));

vi.mock("../../utils/logger.js", () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { prisma } from "../../db/prisma.js";
import { BadRequestError } from "../../errors/app.error.js";
import { OrderService } from "./order.service.js";

const mockCart = vi.mocked(prisma.cart);
const mockOrder = vi.mocked(prisma.order);

const fakeProduct = { id: "prod-1", name: "Jeans", price: 5000, stock: 5 };
const fakeCartWithItems = {
	id: "cart-1",
	userId: "user-1",
	items: [
		{ productId: "prod-1", quantity: 2, product: fakeProduct },
	],
};
const fakeOrder = {
	id: "order-1",
	userId: "user-1",
	total: 10000,
	status: "PENDING",
	createdAt: new Date(),
	items: [],
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("OrderService.checkout", () => {
	it("should throw BadRequestError when cart is not found", async () => {
		mockCart.findUnique.mockResolvedValue(null);

		const service = new OrderService();
		await expect(service.checkout("user-1")).rejects.toThrow(BadRequestError);
		await expect(service.checkout("user-1")).rejects.toThrow(
			"Your cart is empty.",
		);
	});

	it("should throw BadRequestError when cart has no items", async () => {
		mockCart.findUnique.mockResolvedValue({
			id: "cart-1",
			userId: "user-1",
			items: [],
		} as any);

		const service = new OrderService();
		await expect(service.checkout("user-1")).rejects.toThrow(BadRequestError);
	});

	it("should throw BadRequestError when a product has insufficient stock", async () => {
		mockCart.findUnique.mockResolvedValue({
			...fakeCartWithItems,
			items: [
				{
					productId: "prod-1",
					quantity: 10,
					product: { ...fakeProduct, stock: 3 },
				},
			],
		} as any);

		const service = new OrderService();
		await expect(service.checkout("user-1")).rejects.toThrow(BadRequestError);
	});

	it("should create an order, decrement stock, and clear the cart", async () => {
		mockCart.findUnique.mockResolvedValue(fakeCartWithItems as any);
		mockTx.order.create.mockResolvedValue(fakeOrder as any);
		mockTx.product.update.mockResolvedValue({} as any);
		mockTx.cartItem.deleteMany.mockResolvedValue({} as any);

		const service = new OrderService();
		const result = await service.checkout("user-1");

		// Order created with correct total (price * quantity)
		expect(mockTx.order.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					userId: "user-1",
					total: 10000, // 5000 * 2
					status: "PENDING",
				}),
			}),
		);

		// Stock decremented for the product
		expect(mockTx.product.update).toHaveBeenCalledWith({
			where: { id: "prod-1" },
			data: { stock: { decrement: 2 } },
		});

		// Cart items cleared
		expect(mockTx.cartItem.deleteMany).toHaveBeenCalledWith({
			where: { cartId: "cart-1" },
		});

		expect(result).toEqual(fakeOrder);
	});
});

describe("OrderService.myOrders", () => {
	it("should return paginated orders for the user", async () => {
		mockOrder.findMany.mockResolvedValue([fakeOrder] as any);
		mockOrder.count.mockResolvedValue(1);

		const service = new OrderService();
		const result = await service.myOrders("user-1", { page: 1, limit: 10 });

		expect(mockOrder.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ skip: 0, take: 10, where: { userId: "user-1" } }),
		);
		expect(result).toMatchObject({
			orders: [fakeOrder],
			total: 1,
			page: 1,
			limit: 10,
			totalPages: 1,
		});
	});

	it("should filter by status when provided", async () => {
		mockOrder.findMany.mockResolvedValue([fakeOrder] as any);
		mockOrder.count.mockResolvedValue(1);

		const service = new OrderService();
		await service.myOrders("user-1", { page: 1, limit: 10, status: "PENDING" });

		expect(mockOrder.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { userId: "user-1", status: "PENDING" },
			}),
		);
	});

	it("should calculate correct page offset and totalPages", async () => {
		mockOrder.findMany.mockResolvedValue([]);
		mockOrder.count.mockResolvedValue(15);

		const service = new OrderService();
		const result = await service.myOrders("user-1", { page: 2, limit: 5 });

		expect(mockOrder.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ skip: 5, take: 5 }),
		);
		expect(result.totalPages).toBe(3);
	});
});

describe("OrderService.orderById", () => {
	it("should return an order when it belongs to the user", async () => {
		mockOrder.findUnique.mockResolvedValue(fakeOrder as any);

		const service = new OrderService();
		const result = await service.orderById("user-1", { id: "order-1" });

		expect(mockOrder.findUnique).toHaveBeenCalledWith({
			where: { id: "order-1", userId: "user-1" },
			include: { items: { include: { product: true } } },
		});
		expect(result).toEqual(fakeOrder);
	});

	it("should return null when the order does not exist (missing await in source)", async () => {
		// NOTE: The source has a missing `await` on `prisma.order.findUnique`, so the
		// `if (!order)` check is never reached (the Promise is always truthy). This
		// test documents the current behaviour so any future fix is immediately
		// visible in the test results.
		mockOrder.findUnique.mockResolvedValue(null);

		const service = new OrderService();
		// The method returns the Promise directly instead of the resolved value,
		// so we expect null after awaiting the returned (promise-wrapped) result.
		const result = await service.orderById("user-1", { id: "order-missing" });
		expect(result).toBeNull();
	});
});
