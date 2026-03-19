import { prisma } from "../../db/prisma.js";
import type { createCartItemDto } from "./cart.schema.js";

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
}

export default new CartService();
