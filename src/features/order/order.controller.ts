import type { Request, Response } from "express";
import orderService from "./order.service.js";
import {
	type GetMyOrdersDto,
	type OrderParamsDto,
	type UpdateStatusOrderBody,
	type UpdateStatusOrderParams,
} from "./order.schema.js";
import { stripe } from "@/utils/stripe.js";
import { logger } from "@/utils/logger.js";
import { prisma } from "../../db/prisma.js";
import { acquireLock } from "@/utils/redis.js";

export class OrderController {
	async checkoutCart(req: Request, res: Response) {
		const userId = req.user.id;
		const result = await orderService.checkout(userId);
		res.json(result);
	}

	async handleStripeWebhook(req: Request, res: Response) {
		const sig = req.headers["stripe-signature"] as string;
		let event;

		try {
			event = stripe.webhooks.constructEvent(
				req.body,
				sig,
				process.env.STRIPE_WEBHOOK_SECRET as string,
			);
		} catch (err: any) {
			logger.error({ err }, "Stripe webhook signature mismatch");
			return res.status(400).send(`Webhook Error: ${err.message}`);
		}

		if (event.type === "checkout.session.completed") {
			const session = event.data.object as any;
			const orderId = session.metadata.orderId;
			const userId = session.metadata.userId;

			const eventId = event.id;

			const locked = await acquireLock(eventId, 30);
			if (!locked) {
				logger.warn({ eventId }, "Redis Lock: Duplicate request ignored");
				return res.json({
					received: true,
					message: "Processing already in progress",
				});
			}

			try {
				await prisma.$transaction(async (tx) => {
					await tx.processedStripeEvent.create({
						data: { id: eventId },
					});

					const updatedOrder = await tx.order.update({
						where: { id: orderId },
						data: { status: "PAID" },
						include: { items: true },
					});

					for (const item of updatedOrder.items) {
						await tx.product.update({
							where: { id: item.productId },
							data: { stock: { decrement: item.quantity } },
						});
					}

					const cart = await tx.cart.findUnique({
						where: { userId: userId },
					});

					if (cart) {
						await tx.cartItem.deleteMany({
							where: { cartId: cart.id },
						});
					}

					await tx.outboxEvent.create({
						data: {
							type: "ORDER_PAID",
							payload: {
								orderId,
								userId,
								customerEmail: session.customer_details?.email,
								amount: session.amount_total,
							},
						},
					});

					logger.info(
						{ eventId, orderId },
						"Transaction committed: Logic + Outbox saved",
					);
				});

				logger.info(
					{ orderId, userId },
					"Order successfully PAID and fulfilled!",
				);
			} catch (dbError) {
				logger.error(
					{ dbError, orderId },
					"Database error during webhook fulfillment",
				);
				return res.status(500).send("Fulfillment failed");
			}
		}

		res.json({ received: true });
	}

	async getMyOrders(req: Request, res: Response) {
		const userId = req.user.id;

		const query = req.query as unknown as GetMyOrdersDto;

		const order = await orderService.myOrders(userId, query);
		res.status(200).json({
			success: true,
			data: order,
		});
	}

	async getOrderById(req: Request, res: Response) {
		const userId = req.user.id;
		const orderId = req.params as unknown as OrderParamsDto;

		const order = await orderService.orderById(userId, orderId);

		res.status(200).json({
			success: true,
			data: order,
		});
	}

	async UpdateOrderStatus(req: Request, res: Response) {
		const { id } = req.params as unknown as UpdateStatusOrderParams;
		const dto = req.body as UpdateStatusOrderBody;

		const updatedOrder = await orderService.updateStatus(id, dto);
		res.status(200).json({
			success: true,
			data: updatedOrder,
		});
	}
}

export default new OrderController();
