import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../db/prisma.js", () => ({
	prisma: {
		user: {
			findUnique: vi.fn(),
			create: vi.fn(),
			delete: vi.fn(),
		},
	},
}));

import { prisma } from "../../db/prisma.js";
import { NotFoundError } from "../../errors/app.error.js";
import { UserService } from "./user.service.js";

const mockUser = vi.mocked(prisma.user);

beforeEach(() => {
	vi.clearAllMocks();
});

describe("UserService.getCurrentUser", () => {
	it("should return the user when found", async () => {
		const fakeUser = {
			id: "u1",
			clerkId: "clerk_1",
			email: "a@test.com",
			createdAt: new Date(),
			cart: null,
		};
		mockUser.findUnique.mockResolvedValue(fakeUser as any);

		const service = new UserService();
		const result = await service.getCurrentUser("clerk_1");

		expect(mockUser.findUnique).toHaveBeenCalledWith({
			where: { clerkId: "clerk_1" },
			include: { cart: true },
		});
		expect(result).toEqual(fakeUser);
	});

	it("should throw NotFoundError when user does not exist", async () => {
		mockUser.findUnique.mockResolvedValue(null);

		const service = new UserService();
		await expect(service.getCurrentUser("clerk_missing")).rejects.toThrow(
			NotFoundError,
		);
		await expect(service.getCurrentUser("clerk_missing")).rejects.toThrow(
			"User not found",
		);
	});
});

describe("UserService.handleEvent", () => {
	it("should create a user on 'user.created' event with email", async () => {
		const fakeCreated = { id: "u1", clerkId: "clerk_1", email: "b@test.com" };
		mockUser.create.mockResolvedValue(fakeCreated as any);

		const service = new UserService();
		await service.handleEvent({
			type: "user.created",
			data: {
				id: "clerk_1",
				email_addresses: [{ email_address: "b@test.com" }],
			},
		} as any);

		expect(mockUser.create).toHaveBeenCalledOnce();
		expect(mockUser.create).toHaveBeenCalledWith({
			data: {
				clerkId: "clerk_1",
				email: "b@test.com",
				cart: { create: {} },
			},
		});
	});

	it("should NOT create a user when email_addresses is empty on 'user.created'", async () => {
		const service = new UserService();
		await service.handleEvent({
			type: "user.created",
			data: { id: "clerk_1", email_addresses: [] },
		} as any);

		expect(mockUser.create).not.toHaveBeenCalled();
	});

	it("should delete a user on 'user.deleted' event", async () => {
		mockUser.delete.mockResolvedValue({} as any);

		const service = new UserService();
		await service.handleEvent({
			type: "user.deleted",
			data: { id: "clerk_2" },
		} as any);

		expect(mockUser.delete).toHaveBeenCalledWith({
			where: { clerkId: "clerk_2" },
		});
	});

	it("should NOT delete when id is missing on 'user.deleted'", async () => {
		const service = new UserService();
		await service.handleEvent({
			type: "user.deleted",
			data: {},
		} as any);

		expect(mockUser.delete).not.toHaveBeenCalled();
	});

	it("should do nothing for unknown event types", async () => {
		const service = new UserService();
		await service.handleEvent({ type: "session.created", data: {} } as any);

		expect(mockUser.create).not.toHaveBeenCalled();
		expect(mockUser.delete).not.toHaveBeenCalled();
	});
});
