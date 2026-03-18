import type { WebhookEvent } from "@clerk/express";
import { prisma } from "../../db/prisma.js";

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
			where: { id: clerkId },
			include: {
				cart: true,
				// orders: true
			},
		});

		if (!user) throw new Error("User not found in DataBase");
		return user;
	}

	private async createUser(clerkId: string, email: string) {
		return prisma.user.create({
			data: {
				id: clerkId,
				email: email,
				cart: { create: {} },
			},
		});
	}

	private async deleteUser(clerkId: string) {
		return prisma.user.delete({
			where: {
				id: clerkId,
			},
		});
	}
}

export default new UserService();
