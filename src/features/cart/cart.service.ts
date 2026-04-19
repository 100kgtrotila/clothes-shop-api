import { logger } from "@/utils/logger.js";
import { prisma } from "../../db/prisma.js";
import { BadRequestError, NotFoundError } from "../../errors/app.error.js";
import type { AddCartItemDto, UpdateCartItemDto } from "./cart.schema.js";

export class CartService {
	async addItem(userId: string, dto: AddCartItemDto) {
		const cart = await prisma.cart.upsert({
			where: { userId },
			create: { userId },
			update: {},
		});

		const product = await prisma.product.findUnique({
			where: { id: dto.productId },
		});

		if (!product) {
			throw new NotFoundError("Prodcut not found");
		}

		if (product.stock <= 0) {
			throw new BadRequestError("Sold out");
		}

		const existingItem = await prisma.cartItem.findUnique({
			where: {
				cartId_productId: {
					cartId: cart.id,
					productId: dto.productId,
				},
			},
		});

		if (existingItem) {
			const newQuantity = existingItem.quantity + dto.quantity;
			if (product.stock < newQuantity) {
				throw new BadRequestError(`It's only ${product.stock} in stock.`);
			}

			const updated = await prisma.cartItem.update({
				where: { id: existingItem.id },
				data: { quantity: newQuantity },
			});
			logger.info(
				{ userId, productId: dto.productId, newQuantity },
				"User updated item quantity in cart",
			);
			return updated;
		}

		const newItem = await prisma.cartItem.create({
			data: {
				cartId: cart.id,
				productId: dto.productId,
				quantity: dto.quantity,
			},
		});

		logger.info(
			{ userId, productId: dto.productId, quantity: dto.quantity },
			"User added new item to cart",
		);
		return newItem;
	}

	async getUserCart(userId: string) {
		const cart = await prisma.cart.upsert({
			where: { userId },
			create: { userId },
			update: {},
		});
		return cart;
	}

	async updateItem(userId: string, dto: UpdateCartItemDto, productId: string) {
		const cart = await prisma.cart.findUnique({
			where: { userId },
		});
		if (!cart) {
			throw new NotFoundError("Cart not found");
		}
		const cartItem = await prisma.cartItem.findUnique({
			where: {
				cartId_productId: {
					cartId: cart.id,
					productId,
				},
			},
		});
		if (!cartItem) throw new NotFoundError("Cart item not found");

		const product = await prisma.product.findUnique({
			where: { id: productId },
		});
		if (!product) throw new NotFoundError("Product not found");

		if (product.stock < dto.quantity) {
			throw new BadRequestError(
				`Not enough products in stock: ${product.stock}.`,
			);
		}

		const updatedItem = await prisma.cartItem.update({
			where: { id: cartItem.id },
			data: {
				quantity: dto.quantity,
			},
		});

		logger.info(
			{ userId, productId, newQuantity: dto.quantity },
			"User updated cart item quantity",
		);
		return updatedItem;
	}

	async deleteItem(userId: string, productId: string) {
		const cart = await prisma.cart.findUnique({
			where: { userId },
		});
		if (!cart) {
			throw new NotFoundError("Cart not found");
		}
		const cartItem = await prisma.cartItem.findUnique({
			where: {
				cartId_productId: {
					cartId: cart.id,
					productId,
				},
			},
		});
		if (!cartItem) {
			throw new NotFoundError(`Product with id ${productId} not found in cart`);
		}
		return prisma.cartItem.delete({
			where: { id: cartItem.id },
		});
	}
}

export default new CartService();
