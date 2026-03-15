import type { Response } from "express";
import userService from "./user.service.js";
import type { WebhookRequest } from "../../middlewares/webhook.middleware.js";

export class UserController {
	async handleClerkWebhook(req: WebhookRequest, res: Response): Promise<void> {
		try {
			const event = req.clerkEvent!;

			await userService.handleEvent(event);

			res.status(200).json({ success: true, message: "Webhook processed" });
		} catch (error) {
			console.error("Webhook error", error);
			res.status(200).json({ success: true, message: "DB Error (Ignored)" });
		}
	}
}

export default new UserController();
