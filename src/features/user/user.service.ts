import type { WebhookEvent } from "@clerk/express";
import { prisma } from "../../db/prisma.js";
import { NotFoundError } from "../../errors/app.error.js";

export class UserService {
	async handleEvent(event: WebhookEvent) {
		switch (event.type) {
			case "user.created": {
				const email = event.data.email_addresses[0]?.email_address;
				if (email) {
					await this.createUser(event.data.id, email);
				}
				break;
			}

			case "user.deleted": {
				if (event.data.id) {
					await this.deleteUser(event.data.id);
				}
				break;
			}
		}
	}

	async getCurrentUser(clerkId: string) {
		const user = await prisma.user.findUnique({
			where: { clerkId },
			include: {
				cart: true,
				// orders: true
			},
		});

		if (!user) throw new NotFoundError("User not found");
		return user;
	}

	private async createUser(clerkId: string, email: string) {
		return prisma.user.create({
			data: {
				clerkId,
				email: email,
				cart: { create: {} },
			},
		});
	}

	private async deleteUser(clerkId: string) {
		return prisma.user.delete({
			where: {
				clerkId,
			},
		});
	}
}

export default new UserService();
