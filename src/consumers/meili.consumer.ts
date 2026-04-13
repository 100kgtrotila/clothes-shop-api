import amqp from "amqplib";
import { logger } from "@/utils/logger.js";
import { meiliClient } from "@/utils/meilisearch.js";

export async function startMeiliConsumer() {
	const connection = await amqp.connect(
		process.env.RABBITMQ_URL || "amqp://localhost",
	);
	const channel = await connection.createChannel();

	const queue = "meili_sync";
	await channel.assertQueue(queue, { durable: true });

	logger.info("Meilisearch Consumer started");

	channel.consume(queue, async (msg) => {
		if (msg !== null) {
			try {
				const event = JSON.parse(msg.content.toString());
				if (
					event.type === "PRODUCT_CREATED" ||
					event.type === "PRODUCT_UPDATED"
				) {
					await meiliClient.index("products").addDocuments([event.payload]);
					logger.info(
						{ productId: event.payload.id },
						"Product synced to Meilisearch",
					);
				} else if (event.type === "PRODUCT_DELETED") {
					await meiliClient.index("products").deleteDocument(event.payload.id);
					logger.info(
						{ productId: event.payload.id },
						"Product removed from Meilisearch",
					);
				}

				channel.ack(msg);
			} catch (err) {
				logger.error({ err }, "Failed to sync product to Meilisearch");
				channel.nack(msg, false, true);
			}
		}
	});
}
