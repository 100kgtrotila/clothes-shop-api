import type { WebhookEvent } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { Webhook } from "svix";

export interface WebhookRequest extends Request {
	clerkEvent?: WebhookEvent;
}

export const verifyClerkWebhook = (
	req: WebhookRequest,
	res: Response,
	next: NextFunction,
): void => {
	const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

	if (!WEBHOOK_SECRET) {
		next(new Error("Webhook secret is missing"));
		return;
	}

	const svix_id = req.headers["svix-id"] as string;
	const svix_timestamp = req.headers["svix-timestamp"] as string;
	const svix_signature = req.headers["svix-signature"] as string;

	if (!svix_id || !svix_timestamp || !svix_signature) {
		res.status(400).json({
			success: false,
			message: "Bad request",
		});
		return;
	}

	const payload =
		typeof req.body === "string" ? req.body : req.body.toString("utf8");

	const wh = new Webhook(WEBHOOK_SECRET);

	try {
		req.clerkEvent = wh.verify(payload, {
			"svix-id": svix_id,
			"svix-timestamp": svix_timestamp,
			"svix-signature": svix_signature,
		}) as WebhookEvent;

		next();
	} catch (err) {
		console.log("Webhook failed", err);
		res.status(400).json({
			success: false,
			message: "Bad request",
		});
	}
};
