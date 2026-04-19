import amqp from "amqplib";
import { payloadSchema } from "@/features/product/product.schema.js";
import { prisma } from "../db/prisma.js";
import { logger } from "../utils/logger.js";
import { meiliClient } from "../utils/meilisearch.js";

export async function startProductConsumer() {
	try {
		const connection = await amqp.connect(
			process.env.RABBITMQ_URL || "amqp://localhost",
		);

		connection.on("close", (err) => {
			logger.error(
				{ err },
				"RabbitMQ connection closed. Reconnecting in 5s...",
			);
			setTimeout(startProductConsumer, 5000);
		});

		connection.on("error", (err) => {
			logger.error({ err }, "RabbitMQ connection error");
		});

		const channel = await connection.createChannel();

		const EXCHANGE_NAME = "shop_events";
		const QUEUE_NAME = "product_aggregation";

		channel.prefetch(1);

		await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
		await channel.assertQueue(QUEUE_NAME, { durable: true });

		await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "review.*");

		logger.info(
			"Product Aggregation Consumer started. Listening for 'review.*'",
		);

		channel.consume(QUEUE_NAME, async (msg) => {
			if (msg !== null) {
				try {
					const parsed = payloadSchema.safeParse(
						JSON.parse(msg.content.toString()),
					);

					if (!parsed.success) {
						logger.error({ err: parsed.error }, "Invalid payload format");
						return channel.nack(msg, false, false);
					}

					const { productId } = parsed.data;

					const aggregations = await prisma.review.aggregate({
						where: { productId },
						_avg: { rating: true },
						_count: { id: true },
					});

					const newAverage = aggregations._avg.rating || 0;
					const newCount = aggregations._count.id;

					const updatedProduct = await prisma.product.update({
						where: { id: productId },
						data: {
							averageRating: newAverage,
							reviewCount: newCount,
						},
					});

					await meiliClient.index("products").updateDocuments([
						{
							id: updatedProduct.id,
							averageRating: updatedProduct.averageRating,
							reviewCount: updatedProduct.reviewCount,
						},
					]);

					logger.info(
						{
							productId: updatedProduct.id,
							newAverage: updatedProduct.averageRating,
						},
						"Product rating recalculated and synced",
					);
					channel.ack(msg);
				} catch (err) {
					logger.error({ err }, "Failed to aggregate product reviews");
					channel.nack(msg, false, true);
				}
			}
		});
	} catch (err) {
		logger.error({ err }, "Failed to connect to RabbitMQ. Retrying in 5s...");
		setTimeout(startProductConsumer, 5000);
	}
}
