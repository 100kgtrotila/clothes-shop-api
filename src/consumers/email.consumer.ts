import { render } from "@react-email/render";
import amqp from "amqplib";
import { Resend } from "resend";
import { logger } from "@/utils/logger.js";
import { ReceiptEmail } from "../templates/ReceiptEmail.js";

const resend = new Resend(process.env.RESEND_API_KEY!);

const DLQ = "order_notifications.dead_letter";
const DLX = "dlx";
const MAX_RETRIES = 3;

export async function startEmailConsumer() {
	try {
		const connection = await amqp.connect(
			process.env.RABBITMQ_URL || "amqp://localhost",
		);

		connection.on("close", (err) => {
			logger.error(
				{ err },
				"RabbitMQ connection closed. Reconnecting in 5s...",
			);
			setTimeout(startEmailConsumer, 5000);
		});
		connection.on("error", (err) => {
			logger.error({ err }, "RabbitMQ connection error");
		});
		const channel = await connection.createChannel();

		const EXCHANGE_NAME = "shop_events";
		const QUEUE_NAME = "order_notifications";

		await channel.assertExchange(DLX, "direct", { durable: true });
		await channel.assertQueue(DLQ, { durable: true });
		await channel.bindQueue(DLQ, DLX, "dead_letter");

		channel.prefetch(1);

		await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
		await channel.assertQueue(QUEUE_NAME, {
			durable: true,
			arguments: {
				"x-dead-letter-exchange": DLX,
				"x-dead-letter-routing-key": "dead_letter",
			},
		});

		await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "order.*");

		channel.prefetch(1);

		logger.info("Email consumer started with DLQ support");

		channel.consume(QUEUE_NAME, async (msg) => {
			if (!msg) return;
			const headers = msg.properties.headers ?? {};
			const retries = (headers["x-retry-count"] as number | undefined) ?? 0;

			try {
				const payload = JSON.parse(msg.content.toString());
				const { orderId, customerEmail, amount, items } = payload;

				logger.info({ orderId, retries }, "Processing email");

				const htmlContent = await render(
					ReceiptEmail({
						orderId,
						items,
						subtotal: amount / 100,
						shipping: 0,
						total: amount / 100,
						customerName: customerEmail?.split("@")[0] ?? "Valued Customer",
						address: "Shipping Address",
					}),
				);

				const { data, error } = await resend.emails.send({
					from: "Grain Shop by holydxvi <noreply@holydxvi.me>",
					to: [customerEmail],
					subject: `Order Confirmation #${orderId.substring(0, 8)}`,
					html: htmlContent,
				});

				if (error) {
					throw new Error(`Resend API error: ${error.message}`);
				}

				logger.info({ resendId: data?.id, orderId }, "Email sent successfully");
				channel.ack(msg);
			} catch (err) {
				logger.error({ err, retries }, "Failed to process email");

				if (retries >= MAX_RETRIES - 1) {
					logger.error(
						{ retries },
						`Max retries (${MAX_RETRIES}) reached → DLQ`,
					);
					channel.nack(msg, false, false);
				} else {
					const delayMs = 2 ** retries * 60 * 1000;

					setTimeout(() => {
						try {
							channel.publish("", QUEUE_NAME, msg.content, {
								persistent: true,
								headers: { ...headers, "x-retry-count": retries + 1 },
							});

							channel.ack(msg);
							logger.info(
								{ retries: retries + 1 },
								"Email republished for retry",
							);
						} catch (publishErr) {
							logger.error(
								{ publishErr },
								"Failed to republish message. Requeueing original.",
							);
							channel.nack(msg, false, true);
						}
					}, delayMs);
					channel.ack(msg);
				}
			}
		});
	} catch (err) {
		logger.error({ err }, "Failed to connect to RabbitMQ. Retrying in 5s...");
		setTimeout(startEmailConsumer, 5000);
	}
}
