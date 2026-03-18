import type { Response, Request } from "express";
import userService from "./user.service.js";
import type { WebhookRequest } from "../../middlewares/webhook.middleware.js";
import { getAuth } from "@clerk/express";

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

	async getMe(req: Request, res: Response): Promise<void> {
		try {
			const { userId } = getAuth(req);

			if (!userId) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			const user = await userService.getCurrentUser(userId);

			res.status(200).json({ success: true, data: user });
		} catch (error) {
			res.status(404).json({ success: false, message: "User not found" });
		}
	}
}

export default new UserController();
