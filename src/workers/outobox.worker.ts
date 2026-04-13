import amqp from "amqplib";
import { prisma } from "../db/prisma.js";
import { logger } from "../utils/logger.js";

export async function startOutboxWorker() {
	const connection = await amqp.connect(
		process.env.RABBITMQ_URL || "amqp://localhost",
	);

	const channel = await connection.createChannel();
	const queue = "order_notifications";

	await channel.assertQueue(queue, {
		durable: true,
		arguments: {
			"x-dead-letter-exchange": "dlx",
			"x-dead-letter-routing-key": "dead_letter",
		},
	});

	logger.info("Outbox worker started");

	setInterval(async () => {
		const events = await prisma.outboxEvent.findMany({
			where: { processed: false },
			take: 10,
		});

		for (const event of events) {
			try {
				const messsge = JSON.stringify(event.payload);
				channel.sendToQueue(queue, Buffer.from(messsge), { persistent: true });
				await prisma.outboxEvent.update({
					where: { id: event.id },
					data: { processed: true },
				});

				logger.info({ eventId: event.id }, "Event pushed to RabbitMQ");
			} catch (err) {
				logger.error({ err }, "Failed to push event to RabbitMQ");
			}
		}
	}, 5000);
}
