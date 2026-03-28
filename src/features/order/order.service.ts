import { prisma } from "../../db/prisma.js";
import { BadRequestError, NotFoundError } from "../../errors/app.error.js";
import { logger } from "../../utils/logger.js";
import type {
	GetMyOrdersDto,
	OrderParamsDto,
	UpdateStatusOrderBody,
} from "./order.schema.js";

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

	async myOrders(userId: string, dto: GetMyOrdersDto) {
		const { page, limit, status } = dto;
		const skip = (page - 1) * limit;
		const where = status ? { userId, status } : { userId };

		const [orders, total] = await Promise.all([
			prisma.order.findMany({
				skip,
				take: limit,
				where,
			}),
			prisma.order.count({ where }),
		]);

		return {
			orders,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async orderById(userId: string, dto: OrderParamsDto) {
		const order = await prisma.order.findUnique({
			where: {
				id: dto.id,
				userId: userId,
			},
			include: {
				items: true,
			},
		});

		if (!order) {
			throw new NotFoundError(`Order with id ${dto.id} not found`);
		}

		return order;
	}

	async updateStatus(id: string, dto: UpdateStatusOrderBody) {
		const order = await prisma.order.findUnique({
			where: {
				id: id,
			},
		});

		if (!order) {
			throw new NotFoundError(`Order with id ${id} not found`);
		}

		return prisma.order.update({
			where: { id: id },
			data: {
				status: dto.status,
			},
		});
	}
}

export default new OrderService();
