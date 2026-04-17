import amqp from "amqplib";
import { prisma } from "../db/prisma.js";
import { logger } from "../utils/logger.js";
import { meiliClient } from "../utils/meilisearch.js";

export async function startProductConsumer() {
	const connection = await amqp.connect(
		process.env.RABBITMQ_URL || "amqp://localhost",
	);
	const channel = await connection.createChannel();

	const EXCHANGE_NAME = "shop_events";
	const QUEUE_NAME = "product_aggregation";

	await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
	await channel.assertQueue(QUEUE_NAME, { durable: true });

	await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "review.*");

	logger.info("Product Aggregation Consumer started. Listening for 'review.*'");

	channel.consume(QUEUE_NAME, async (msg) => {
		if (msg !== null) {
			try {
				const { productId } = JSON.parse(msg.content.toString());

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
}
