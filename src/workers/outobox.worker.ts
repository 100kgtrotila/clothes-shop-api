import amqp from "amqplib";
import { prisma } from "../db/prisma.js";
import { logger } from "../utils/logger.js";

export async function startOutboxWorker() {
	const connection = await amqp.connect(
		process.env.RABBITMQ_URL || "amqp://localhost",
	);

	const channel = await connection.createChannel();
	const EXCHANGE_NAME = "shop_events";

	await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });

	logger.info("Outbox worker started");

	setInterval(async () => {
		const events = await prisma.outboxEvent.findMany({
			where: { processed: false },
			take: 10,
		});

		for (const event of events) {
			try {
				const message = JSON.stringify(event.payload);

				channel.publish(
					EXCHANGE_NAME,
					event.type.toLocaleLowerCase(),
					Buffer.from(message),
					{ persistent: true },
				);
				logger.info(
					{ eventId: event.id, routingKey: event.type },
					"Event published to Exchange",
				);

				await prisma.outboxEvent.update({
					where: { id: event.id },
					data: { processed: true },
				});
			} catch (err) {
				logger.error({ err, eventId: event.id }, "Failed to publish event");
			}
		}
	}, 5000);
}
