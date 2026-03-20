import { prisma } from "../../db/prisma.js";
import type { createCartItemDto, updateItemCartDto } from "./cart.schema.js";

export class CartService {
	async addItem(userId: string, dto: createCartItemDto) {
		const cart = await prisma.cart.findUnique({
			where: { userId },
		});

		if (!cart) {
			throw new Error(`Cart not found`);
		}

		return prisma.cartItem.create({
			data: {
				cartId: cart.id,
				productId: dto.productId,
				quantity: dto.quantity,
			},
		});
	}

	async getUserCart(userId: string) {
		const cart = await prisma.cart.findUnique({
			where: { userId },
			include: {
				items: {
					include: {
						product: true,
					},
				},
			},
		});

		if (!cart) {
			throw new Error("Cart not found");
		}

		return cart;
	}

	async updateItem(userId: string, dto: updateItemCartDto, productId: string) {
		const cart = await prisma.cart.findUnique({
			where: { userId },
		});

		if (!cart) {
			throw new Error("Cart not found");
		}

		const cartItem = await prisma.cartItem.findUnique({
			where: {
				cartId_productId: {
					cartId: cart.id,
					productId: productId,
				},
			},
		});

		if (!cartItem) {
			throw new Error(`Product with id ${productId} not found`);
		}

		return prisma.cartItem.update({
			where: { id: cartItem.id },
			data: {
				quantity: dto.quantity,
			},
		});
	}

	async deleteItem(userId: string, productId: string) {
		const cart = await prisma.cart.findUnique({
			where: { userId },
		});

		if (!cart) {
			throw new Error("Cart not found");
		}

		const cartItem = await prisma.cartItem.findUnique({
			where: {
				cartId_productId: {
					cartId: cart.id,
					productId: productId,
				},
			},
		});

		if (!cartItem) {
			throw new Error("Product not found in cart");
		}

		return prisma.cartItem.delete({
			where: { id: cartItem.id },
		});
	}
}

export default new CartService();
