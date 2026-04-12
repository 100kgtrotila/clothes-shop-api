import { prisma } from "../../db/prisma.js";
import { BadRequestError, NotFoundError } from "../../errors/app.error.js";
import { logger } from "../../utils/logger.js";
import { stripe } from "../../utils/stripe.js";
import Stripe from "stripe";
import type {
	GetMyOrdersDto,
	OrderParamsDto,
	UpdateStatusOrderBody,
} from "./order.schema.js";

export class OrderService {
	async checkout(userId: string) {
		const cart = await prisma.cart.findUnique({
			where: { userId },
			include: { items: { include: { product: true } } },
		});

		if (!cart || cart.items.length === 0) {
			throw new BadRequestError("Your cart is empty.");
		}

		const reserved: Array<{
			productId: string;
			quantity: number;
			name: string;
		}> = [];

		try {
			for (const item of cart.items) {
				const result = await prisma.product.updateMany({
					where: {
						id: item.productId,
						stock: { gte: item.quantity },
					},
					data: { stock: { decrement: item.quantity } },
				});

				if (result.count === 0) {
					await this.releaseStock(reserved);
					throw new BadRequestError(
						`На жаль, "${item.product.name}" вже немає в достатній кількості`,
					);
				}

				reserved.push({
					productId: item.productId,
					quantity: item.quantity,
					name: item.product.name,
				});
			}

			const totalAmount = cart.items.reduce(
				(sum, item) => sum + Number(item.product.price) * item.quantity,
				0,
			);

			const order = await prisma.order.create({
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
			});

			const line_items = cart.items.map((item) => ({
				price_data: {
					currency: "uah",
					product_data: { name: item.product.name },
					unit_amount: Math.round(Number(item.product.price) * 100),
				},
				quantity: item.quantity,
			}));

			const frontendUrl =
				process.env.FRONTEND_URLS?.split(",")[0] || "http://localhost:5173";

			const session = await stripe.checkout.sessions.create({
				payment_method_types: ["card"],
				mode: "payment",
				line_items,
				expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
				success_url: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${frontendUrl}/cart`,
				metadata: { orderId: order.id, userId },
			});

			logger.info({ userId, orderId: order.id }, "Payment session created");
			return { url: session.url };
		} catch (error: unknown) {
			if (error instanceof Stripe.errors.StripeError) {
				await this.releaseStock(reserved);
				logger.error({ error }, "Stripe error during checkout, stock released");
				throw new BadRequestError(`Payment provider error: ${error.message}`);
			}
			throw error;
		}
	}

	async fulfillOrder(
		eventId: string,
		orderId: string,
		userId: string,
		sessionData: {
			customerEmail: string | null | undefined;
			amountTotal: number | null;
		},
	) {
		await prisma.$transaction(async (tx) => {
			await tx.processedStripeEvent.create({ data: { id: eventId } });

			const updatedOrder = await tx.order.update({
				where: { id: orderId },
				data: { status: "PAID" },
				include: { items: { include: { product: true } } },
			});

			const cart = await tx.cart.findUnique({ where: { userId } });
			if (cart) {
				await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
			}

			await tx.outboxEvent.create({
				data: {
					type: "ORDER_PAID",
					payload: {
						orderId,
						userId,
						customerEmail: sessionData.customerEmail,
						amount: sessionData.amountTotal,
						items: updatedOrder.items.map((item) => ({
							name: item.product.name,
							quantity: item.quantity,
							price: item.price,
						})),
					},
				},
			});

			logger.info(
				{ eventId, orderId },
				"Order fulfilled: PAID + cart cleared + outbox saved",
			);
		});
	}

	private async releaseStock(
		reserved: Array<{ productId: string; quantity: number }>,
	) {
		if (reserved.length === 0) return;
		await Promise.all(
			reserved.map((r) =>
				prisma.product.update({
					where: { id: r.productId },
					data: { stock: { increment: r.quantity } },
				}),
			),
		);
		logger.info({ count: reserved.length }, "Reserved stock released");
	}

	async myOrders(userId: string, dto: GetMyOrdersDto) {
		const { page, limit, status } = dto;
		const skip = (page - 1) * limit;
		const where = status ? { userId, status } : { userId };

		const [orders, total] = await Promise.all([
			prisma.order.findMany({ skip, take: limit, where }),
			prisma.order.count({ where }),
		]);

		return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
	}

	async orderById(userId: string, dto: OrderParamsDto) {
		const order = await prisma.order.findUnique({
			where: { id: dto.id, userId },
			include: { items: true },
		});
		if (!order) throw new NotFoundError(`Order with id ${dto.id} not found`);
		return order;
	}

	async updateStatus(id: string, dto: UpdateStatusOrderBody) {
		const order = await prisma.order.findUnique({ where: { id } });
		if (!order) throw new NotFoundError(`Order with id ${id} not found`);
		return prisma.order.update({ where: { id }, data: { status: dto.status } });
	}
}

export default new OrderService();
