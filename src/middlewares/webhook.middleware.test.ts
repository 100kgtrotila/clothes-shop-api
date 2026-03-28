import type { NextFunction, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WebhookRequest } from "./webhook.middleware.js";
import { verifyClerkWebhook } from "./webhook.middleware.js";

// Mock the svix Webhook class
vi.mock("svix", () => {
	const Webhook = vi.fn();
	Webhook.prototype.verify = vi.fn();
	return { Webhook };
});

import { Webhook } from "svix";

const MockWebhook = vi.mocked(Webhook);

function makeRes() {
	return {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	} as unknown as Response;
}

function makeReq(overrides: Partial<WebhookRequest> = {}): WebhookRequest {
	return {
		headers: {
			"svix-id": "msg_123",
			"svix-timestamp": "1234567890",
			"svix-signature": "v1,signature",
		},
		body: JSON.stringify({ type: "user.created", data: {} }),
		...overrides,
	} as unknown as WebhookRequest;
}

beforeEach(() => {
	vi.clearAllMocks();
	delete process.env["CLERK_WEBHOOK_SECRET"];
});

describe("verifyClerkWebhook middleware", () => {
	it("should call next(error) when CLERK_WEBHOOK_SECRET is not set", () => {
		const req = makeReq();
		const res = makeRes();
		const next = vi.fn() as NextFunction;

		verifyClerkWebhook(req, res, next);

		expect(next).toHaveBeenCalledOnce();
		const [err] = (next as ReturnType<typeof vi.fn>).mock.calls[0] as [Error];
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toMatch(/Webhook secret is missing/);
		expect(res.status).not.toHaveBeenCalled();
	});

	it("should respond 400 when svix-id header is missing", () => {
		process.env["CLERK_WEBHOOK_SECRET"] = "whsec_test";
		const req = makeReq({ headers: { "svix-timestamp": "123", "svix-signature": "v1,sig" } } as any);
		const res = makeRes();
		const next = vi.fn() as NextFunction;

		verifyClerkWebhook(req, res, next);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ success: false, message: "Bad request" });
		expect(next).not.toHaveBeenCalled();
	});

	it("should respond 400 when svix-timestamp header is missing", () => {
		process.env["CLERK_WEBHOOK_SECRET"] = "whsec_test";
		const req = makeReq({ headers: { "svix-id": "id", "svix-signature": "v1,sig" } } as any);
		const res = makeRes();
		const next = vi.fn() as NextFunction;

		verifyClerkWebhook(req, res, next);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(next).not.toHaveBeenCalled();
	});

	it("should respond 400 when svix-signature header is missing", () => {
		process.env["CLERK_WEBHOOK_SECRET"] = "whsec_test";
		const req = makeReq({ headers: { "svix-id": "id", "svix-timestamp": "123" } } as any);
		const res = makeRes();
		const next = vi.fn() as NextFunction;

		verifyClerkWebhook(req, res, next);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(next).not.toHaveBeenCalled();
	});

	it("should respond 400 when the signature verification fails", () => {
		process.env["CLERK_WEBHOOK_SECRET"] = "whsec_test";
		MockWebhook.prototype.verify = vi.fn().mockImplementation(() => {
			throw new Error("Invalid signature");
		});

		const req = makeReq();
		const res = makeRes();
		const next = vi.fn() as NextFunction;

		verifyClerkWebhook(req, res, next);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ success: false, message: "Bad request" });
		expect(next).not.toHaveBeenCalled();
	});

	it("should set req.clerkEvent and call next() on successful verification", () => {
		process.env["CLERK_WEBHOOK_SECRET"] = "whsec_test";
		const fakeEvent = { type: "user.created", data: { id: "usr_1" } };
		MockWebhook.prototype.verify = vi.fn().mockReturnValue(fakeEvent);

		const req = makeReq();
		const res = makeRes();
		const next = vi.fn() as NextFunction;

		verifyClerkWebhook(req, res, next);

		expect(req.clerkEvent).toEqual(fakeEvent);
		expect(next).toHaveBeenCalledOnce();
		expect(next).toHaveBeenCalledWith();
		expect(res.status).not.toHaveBeenCalled();
	});
});
