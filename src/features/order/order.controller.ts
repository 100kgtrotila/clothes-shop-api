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
import { acquireLock } from "@/utils/redis.js";
import { prisma } from "@/db/prisma.js";

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
				await orderService.fulfillOrder(event.id, orderId, userId, {
					customerEmail: session.customer_details?.email,
					amountTotal: session.amount_total,
				});
				logger.info({ orderId, userId }, "Order fulfilled successfully");
			} catch (err) {
				const isDuplicate =
					err instanceof Error && err.message.includes("Unique constraint");
				if (isDuplicate) {
					logger.warn(
						{ eventId: event.id },
						"Duplicate webhook ignored (DB constraint)",
					);
					return res.json({ received: true });
				}
				logger.error({ err, orderId }, "Fulfillment failed");
				return res.status(500).send("Fulfillment failed");
			}
		}

		if (event.type === "checkout.session.expired") {
			const session = event.data.object as any;
			const orderId = session.metadata.orderId;

			await prisma.$transaction(async (tx) => {
				const order = await tx.order.findUnique({
					where: { id: orderId },
					include: { items: true },
				});

				if (order && order.status === "PENDING") {
					for (const item of order.items) {
						await tx.product.update({
							where: { id: item.productId },
							data: { stock: { increment: item.quantity } },
						});
					}

					await tx.order.update({
						where: { id: orderId },
						data: { status: "CANCELLED" },
					});

					logger.info(
						{ orderId },
						"Session expired: Order CANCELLED, stock released",
					);
				}
			});
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
