import amqp from "amqplib";
import { logger } from "@/utils/logger.js";
import { meiliClient } from "@/utils/meilisearch.js";

export async function startMeiliConsumer() {
	try {
		const connection = await amqp.connect(
			process.env.RABBITMQ_URL || "amqp://localhost",
		);

		connection.on("close", (err) => {
			logger.error(
				{ err },
				"RabbitMQ connection closed. Reconnecting in 5s...",
			);
			setTimeout(startMeiliConsumer, 5000);
		});

		connection.on("error", (err) => {
			logger.error({ err }, "RabbitMQ connection error");
		});
		const channel = await connection.createChannel();

		const EXCHANGE_NAME = "shop_events";
		const QUEUE_NAME = "meili_sync";

		channel.prefetch(1);

		await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
		await channel.assertQueue(QUEUE_NAME, { durable: true });
		await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "product.*");
		await channel.assertQueue(QUEUE_NAME, {
			durable: true,
			arguments: {
				"x-dead-letter-exchange": "dlx",
				"x-dead-letter-routing-key": "dead_letter_meili",
			},
		});

		logger.info(
			"Meilisearch Consumer started. Listening for 'product.*' events",
		);

		channel.consume(QUEUE_NAME, async (msg) => {
			if (msg !== null) {
				try {
					const eventData = JSON.parse(msg.content.toString());
					const routingKey = msg.fields.routingKey;

					if (
						routingKey === "product.created" ||
						routingKey === "product.updated"
					) {
						await meiliClient.index("products").addDocuments([eventData]);
						logger.info({ id: eventData.id }, "Product synced to Meilisearch");
					}

					if (routingKey === "product.deleted") {
						await meiliClient.index("products").deleteDocument(eventData.id);
						logger.info(
							{ id: eventData.id },
							"Product removed from Meilisearch",
						);
					}

					channel.ack(msg);
				} catch (err) {
					logger.error({ err }, "Failed to sync product to Meilisearch");
					channel.nack(msg, false, false);
				}
			}
		});
	} catch (err) {
		logger.error({ err }, "Failed to connect to RabbitMQ. Retrying in 5s...");
		setTimeout(startMeiliConsumer, 5000);
	}
}
