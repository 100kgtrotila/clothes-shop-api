import amqp from "amqplib";
import { Resend } from "resend";
import { logger } from "@/utils/logger.js";

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
				const { orderId, customerEmail, amount } = payload;

				logger.info({ orderId }, "Consumer grabbed a message");

				const { data, error } = await resend.emails.send({
					from: "Grain Shop by holydxvi <noreply@holydxvi.me>",
					to: [customerEmail],
					subject: "Successful purchase",
					html: `
						<div style="font-family: sans-serif; padding: 20px; color: #333;">
							<h2 style="color: #F5A623;">Thank you for your order!</h2>
							<p>We have successfully received your payment. Your order is confirmed.</p>
							<div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
								<p><strong>Order ID:</strong> ${orderId}</p>
								<p><strong>Total Amount:</strong> ${(amount / 100).toFixed(2)} UAH</p>
							</div>
							<a href="http://localhost:5173/orders" style="background: #333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Order Status</a>
						</div>
					`,
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
