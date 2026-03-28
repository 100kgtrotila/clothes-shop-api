import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { validate } from "./validate.js";

function makeRes() {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	} as unknown as Response;
	return res;
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("validate middleware", () => {
	const schema = z.object({
		body: z.object({
			name: z.string().min(2),
		}),
	});

	it("should call next() when the body is valid", async () => {
		const req = { body: { name: "Alice" }, query: {}, params: {} } as Request;
		const res = makeRes();
		const next = vi.fn() as NextFunction;

		await validate(schema)(req, res, next);

		expect(next).toHaveBeenCalledOnce();
		expect(next).toHaveBeenCalledWith();
		expect(res.status).not.toHaveBeenCalled();
	});

	it("should respond 400 when body validation fails", async () => {
		const req = { body: { name: "A" }, query: {}, params: {} } as Request;
		const res = makeRes();
		const next = vi.fn() as NextFunction;

		await validate(schema)(req, res, next);

		expect(next).not.toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(400);
		const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as {
			success: boolean;
			message: string;
			errors: { path: string; message: string }[];
		};
		expect(payload.success).toBe(false);
		expect(payload.message).toBe("Validation error");
		expect(payload.errors).toHaveLength(1);
		expect(payload.errors[0]?.path).toBe("body.name");
	});

	it("should respond 400 when a required field is missing", async () => {
		const req = { body: {}, query: {}, params: {} } as Request;
		const res = makeRes();
		const next = vi.fn() as NextFunction;

		await validate(schema)(req, res, next);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(next).not.toHaveBeenCalled();
	});

	it("should assign validated body back to req.body", async () => {
		const trimSchema = z.object({
			body: z.object({ count: z.coerce.number() }),
		});
		const req = {
			body: { count: "42" },
			query: {},
			params: {},
		} as unknown as Request;
		const res = makeRes();
		const next = vi.fn() as NextFunction;

		await validate(trimSchema)(req, res, next);

		expect(next).toHaveBeenCalledOnce();
		expect(req.body.count).toBe(42);
	});

	it("should assign validated query to req.query", async () => {
		const querySchema = z.object({
			query: z.object({ page: z.coerce.number().default(1) }),
		});
		const req = { body: {}, query: {}, params: {} } as Request;
		const res = makeRes();
		const next = vi.fn() as NextFunction;

		await validate(querySchema)(req, res, next);

		expect(next).toHaveBeenCalledOnce();
	});

	it("should assign validated params to req.params", async () => {
		const paramSchema = z.object({
			params: z.object({ id: z.uuid() }),
		});
		const req = {
			body: {},
			query: {},
			params: { id: "550e8400-e29b-41d4-a716-446655440000" },
		} as unknown as Request;
		const res = makeRes();
		const next = vi.fn() as NextFunction;

		await validate(paramSchema)(req, res, next);

		expect(next).toHaveBeenCalledOnce();
	});

	it("should return 400 for invalid UUID in params", async () => {
		const paramSchema = z.object({
			params: z.object({ id: z.uuid() }),
		});
		const req = {
			body: {},
			query: {},
			params: { id: "not-a-uuid" },
		} as unknown as Request;
		const res = makeRes();
		const next = vi.fn() as NextFunction;

		await validate(paramSchema)(req, res, next);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(next).not.toHaveBeenCalled();
	});
});
