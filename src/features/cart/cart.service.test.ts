import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../db/prisma.js", () => ({
	prisma: {
		cart: { findUnique: vi.fn() },
		product: { findUnique: vi.fn() },
		cartItem: {
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

vi.mock("@/utils/logger.js", () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { prisma } from "../../db/prisma.js";
import { BadRequestError, NotFoundError } from "../../errors/app.error.js";
import { CartService } from "./cart.service.js";

const mockCart = vi.mocked(prisma.cart);
const mockProduct = vi.mocked(prisma.product);
const mockCartItem = vi.mocked(prisma.cartItem);

const fakeCart = { id: "cart-1", userId: "user-1" };
const fakeProduct = { id: "prod-1", name: "Jeans", price: 5000, stock: 5 };
const fakeCartItem = {
	id: "item-1",
	cartId: "cart-1",
	productId: "prod-1",
	quantity: 2,
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("CartService.addItem", () => {
	it("should throw NotFoundError when cart does not exist", async () => {
		mockCart.findUnique.mockResolvedValue(null);

		const service = new CartService();
		await expect(
			service.addItem("user-1", { productId: "prod-1", quantity: 1 }),
		).rejects.toThrow(NotFoundError);
	});

	it("should throw NotFoundError when product does not exist", async () => {
		mockCart.findUnique.mockResolvedValue(fakeCart as any);
		mockProduct.findUnique.mockResolvedValue(null);

		const service = new CartService();
		await expect(
			service.addItem("user-1", { productId: "prod-1", quantity: 1 }),
		).rejects.toThrow(NotFoundError);
	});

	it("should throw BadRequestError when product is out of stock", async () => {
		mockCart.findUnique.mockResolvedValue(fakeCart as any);
		mockProduct.findUnique.mockResolvedValue({ ...fakeProduct, stock: 0 } as any);

		const service = new CartService();
		await expect(
			service.addItem("user-1", { productId: "prod-1", quantity: 1 }),
		).rejects.toThrow(BadRequestError);
		await expect(
			service.addItem("user-1", { productId: "prod-1", quantity: 1 }),
		).rejects.toThrow("Sold out");
	});

	it("should create a new cart item when the product is not yet in the cart", async () => {
		mockCart.findUnique.mockResolvedValue(fakeCart as any);
		mockProduct.findUnique.mockResolvedValue(fakeProduct as any);
		mockCartItem.findUnique.mockResolvedValue(null);
		mockCartItem.create.mockResolvedValue(fakeCartItem as any);

		const service = new CartService();
		const result = await service.addItem("user-1", {
			productId: "prod-1",
			quantity: 2,
		});

		expect(mockCartItem.create).toHaveBeenCalledWith({
			data: { cartId: "cart-1", productId: "prod-1", quantity: 2 },
		});
		expect(result).toEqual(fakeCartItem);
	});

	it("should increment quantity when the product already exists in the cart", async () => {
		mockCart.findUnique.mockResolvedValue(fakeCart as any);
		mockProduct.findUnique.mockResolvedValue(fakeProduct as any);
		mockCartItem.findUnique.mockResolvedValue(fakeCartItem as any); // qty=2
		mockCartItem.update.mockResolvedValue({ ...fakeCartItem, quantity: 4 } as any);

		const service = new CartService();
		const result = await service.addItem("user-1", {
			productId: "prod-1",
			quantity: 2,
		});

		expect(mockCartItem.update).toHaveBeenCalledWith({
			where: { id: "item-1" },
			data: { quantity: 4 },
		});
		expect(result).toMatchObject({ quantity: 4 });
	});

	it("should throw BadRequestError when incrementing would exceed stock", async () => {
		mockCart.findUnique.mockResolvedValue(fakeCart as any);
		mockProduct.findUnique.mockResolvedValue({ ...fakeProduct, stock: 3 } as any);
		mockCartItem.findUnique.mockResolvedValue({ ...fakeCartItem, quantity: 2 } as any);

		const service = new CartService();
		await expect(
			service.addItem("user-1", { productId: "prod-1", quantity: 2 }), // 2+2=4 > 3
		).rejects.toThrow(BadRequestError);
		await expect(
			service.addItem("user-1", { productId: "prod-1", quantity: 2 }),
		).rejects.toThrow("It's only 3 in stock.");
	});
});

describe("CartService.getUserCart", () => {
	it("should return the cart with its items", async () => {
		const cartWithItems = { ...fakeCart, items: [fakeCartItem] };
		mockCart.findUnique.mockResolvedValue(cartWithItems as any);

		const service = new CartService();
		const result = await service.getUserCart("user-1");

		expect(mockCart.findUnique).toHaveBeenCalledWith({
			where: { userId: "user-1" },
			include: { items: { include: { product: true } } },
		});
		expect(result).toEqual(cartWithItems);
	});

	it("should throw NotFoundError when cart does not exist", async () => {
		mockCart.findUnique.mockResolvedValue(null);

		const service = new CartService();
		await expect(service.getUserCart("user-1")).rejects.toThrow(NotFoundError);
	});
});

describe("CartService.updateItem", () => {
	it("should throw NotFoundError when the cart does not exist", async () => {
		mockCart.findUnique.mockResolvedValue(null);

		const service = new CartService();
		await expect(
			service.updateItem("user-1", { quantity: 3 }, "prod-1"),
		).rejects.toThrow(NotFoundError);
	});

	it("should throw NotFoundError when the product does not exist", async () => {
		mockCart.findUnique.mockResolvedValue(fakeCart as any);
		mockCartItem.findUnique.mockResolvedValue(fakeCartItem as any);
		mockProduct.findUnique.mockResolvedValue(null);

		const service = new CartService();
		await expect(
			service.updateItem("user-1", { quantity: 3 }, "prod-1"),
		).rejects.toThrow(NotFoundError);
	});

	it("should throw BadRequestError when requested quantity exceeds stock", async () => {
		mockCart.findUnique.mockResolvedValue(fakeCart as any);
		mockCartItem.findUnique.mockResolvedValue(fakeCartItem as any);
		mockProduct.findUnique.mockResolvedValue({ ...fakeProduct, stock: 2 } as any);

		const service = new CartService();
		await expect(
			service.updateItem("user-1", { quantity: 5 }, "prod-1"),
		).rejects.toThrow(BadRequestError);
		await expect(
			service.updateItem("user-1", { quantity: 5 }, "prod-1"),
		).rejects.toThrow("Not enough products in stock: 2.");
	});

	it("should throw NotFoundError when the item is not in the cart", async () => {
		mockCart.findUnique.mockResolvedValue(fakeCart as any);
		mockCartItem.findUnique.mockResolvedValue(null);
		mockProduct.findUnique.mockResolvedValue(fakeProduct as any);

		const service = new CartService();
		await expect(
			service.updateItem("user-1", { quantity: 1 }, "prod-1"),
		).rejects.toThrow(NotFoundError);
	});

	it("should update the cart item quantity", async () => {
		mockCart.findUnique.mockResolvedValue(fakeCart as any);
		mockCartItem.findUnique.mockResolvedValue(fakeCartItem as any);
		mockProduct.findUnique.mockResolvedValue(fakeProduct as any);
		mockCartItem.update.mockResolvedValue({ ...fakeCartItem, quantity: 3 } as any);

		const service = new CartService();
		const result = await service.updateItem("user-1", { quantity: 3 }, "prod-1");

		expect(mockCartItem.update).toHaveBeenCalledWith({
			where: { id: "item-1" },
			data: { quantity: 3 },
		});
		expect(result).toMatchObject({ quantity: 3 });
	});
});

describe("CartService.deleteItem", () => {
	it("should throw NotFoundError when the cart does not exist", async () => {
		mockCart.findUnique.mockResolvedValue(null);

		const service = new CartService();
		await expect(service.deleteItem("user-1", "prod-1")).rejects.toThrow(
			NotFoundError,
		);
	});

	it("should throw NotFoundError when the item is not in the cart", async () => {
		mockCart.findUnique.mockResolvedValue(fakeCart as any);
		mockCartItem.findUnique.mockResolvedValue(null);

		const service = new CartService();
		await expect(service.deleteItem("user-1", "prod-1")).rejects.toThrow(
			NotFoundError,
		);
		await expect(service.deleteItem("user-1", "prod-1")).rejects.toThrow(
			"Product with id prod-1 not found in cart",
		);
	});

	it("should delete the cart item when found", async () => {
		mockCart.findUnique.mockResolvedValue(fakeCart as any);
		mockCartItem.findUnique.mockResolvedValue(fakeCartItem as any);
		mockCartItem.delete.mockResolvedValue(fakeCartItem as any);

		const service = new CartService();
		const result = await service.deleteItem("user-1", "prod-1");

		expect(mockCartItem.delete).toHaveBeenCalledWith({
			where: { id: "item-1" },
		});
		expect(result).toEqual(fakeCartItem);
	});
});
