import amqp from "amqplib";
import { Resend } from "resend";
import { logger } from "@/utils/logger.js";
import { render } from "@react-email/render";
import { ReceiptEmail } from "../templates/ReceiptEmail.js";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function startEmailConsumer() {
	const connection = await amqp.connect(
		process.env.RABBITMQ_URL || "amqp://localhost",
	);
	const channel = await connection.createChannel();
	const queue = "order_notifications";

	await channel.assertQueue(queue, { durable: true });
	logger.info("Resend Consumer started");

	channel.consume(queue, async (msg) => {
		if (msg !== null) {
			try {
				const payload = JSON.parse(msg.content.toString());
				const { orderId, customerEmail, amount, items } = payload;

				logger.info({ orderId }, "Consumer grabbed a message");

				const htmlContent = await render(
					ReceiptEmail({
						orderId: orderId,
						items: items,
						subtotal: amount / 100,
						shipping: 0,
						total: amount / 100,
						customerName: customerEmail.split("@")[0],
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
					logger.error({ error }, "Resend API error");
					return channel.nack(msg, false, false);
				}

				logger.info(
					{ resendId: data?.id },
					"Email sent successfully via Resend!",
				);
				channel.ack(msg);
			} catch (err) {
				logger.error({ err }, "Failed to process email message");
				channel.nack(msg, false, false);
			}
		}
	});
}
