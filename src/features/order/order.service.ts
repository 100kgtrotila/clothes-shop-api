import { prisma } from "../../db/prisma.js";
import { BadRequestError } from "../../errors/app.error.js";
import { logger } from "../../utils/logger.js";

export class OrderService {
	async checkout(userId: string) {
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

		if (!cart || cart.items.length === 0) {
			throw new BadRequestError("Your cart is empty.");
		}

		let totalAmount = 0;
		for (const item of cart.items) {
			if (item.product.stock < item.quantity) {
				throw new BadRequestError(
					`Unfortunately, product "${item.product.name}" only left ${item.product.stock}  (You order ${item.quantity})`,
				);
			}
			totalAmount += Number(item.product.price) * item.quantity;
		}

		const order = await prisma.$transaction(async (tx) => {
			const newOrder = await tx.order.create({
				data: {
					userId,
					total: totalAmount,
					status: "PENDING",
					items: {
						create: cart.items.map((item) => ({
							productId: item.productId,
							quantity: item.quantity,
							price: item.product.price,
						})),
					},
				},
				include: {
					items: true,
				},
			});

			for (const item of cart.items) {
				await tx.product.update({
					where: { id: item.productId },
					data: {
						stock: {
							decrement: item.quantity,
						},
					},
				});
			}

			await tx.cartItem.deleteMany({
				where: { cartId: cart.id },
			});

			return newOrder;
		});

		logger.info(
			{ userId, orderId: order.id, total: totalAmount },
			"New order was successfuly created",
		);

		return order;
	}
}

export default new OrderService();
