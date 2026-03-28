import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/express", () => ({
	getAuth: vi.fn(),
}));

vi.mock("../db/prisma.js", () => ({
	prisma: {
		user: { findUnique: vi.fn() },
	},
}));

import { getAuth } from "@clerk/express";
import { prisma } from "../db/prisma.js";
import { requireApiAuth } from "./auth.middleware.js";

const mockGetAuth = vi.mocked(getAuth);
const mockFindUnique = vi.mocked(prisma.user.findUnique);

function makeRes() {
	return {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	} as unknown as Response;
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("requireApiAuth middleware", () => {
	it("should respond 401 when there is no userId in auth", async () => {
		mockGetAuth.mockReturnValue({ userId: null } as any);
		const req = {} as Request;
		const res = makeRes();
		const next = vi.fn() as NextFunction;

		await requireApiAuth(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			success: false,
			message: "Unauthorized: Missing or invalid token",
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("should respond 401 when the user is not found in the database", async () => {
		mockGetAuth.mockReturnValue({ userId: "clerk_123" } as any);
		mockFindUnique.mockResolvedValue(null);

		const req = {} as Request;
		const res = makeRes();
		const next = vi.fn() as NextFunction;

		await requireApiAuth(req, res, next);

		expect(mockFindUnique).toHaveBeenCalledWith({
			where: { clerkId: "clerk_123" },
		});
		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			success: false,
			message: "User not found",
		});
		expect(next).not.toHaveBeenCalled();
	});

	it("should set req.user and call next() when auth succeeds", async () => {
		const fakeUser = {
			id: "user-1",
			clerkId: "clerk_123",
			email: "test@example.com",
			createdAt: new Date(),
		};
		mockGetAuth.mockReturnValue({ userId: "clerk_123" } as any);
		mockFindUnique.mockResolvedValue(fakeUser as any);

		const req = {} as Request;
		const res = makeRes();
		const next = vi.fn() as NextFunction;

		await requireApiAuth(req, res, next);

		expect(req.user).toEqual(fakeUser);
		expect(next).toHaveBeenCalledOnce();
		expect(next).toHaveBeenCalledWith();
		expect(res.status).not.toHaveBeenCalled();
	});
});
