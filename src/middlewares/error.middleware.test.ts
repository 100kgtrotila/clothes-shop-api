import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError, NotFoundError } from "../errors/app.error.js";
import { errorHandler } from "./error.middleware.js";

// Provide a minimal Prisma mock so the generated client module can be imported
// without a database connection.
vi.mock("../generated/client.js", () => {
	class PrismaClientKnownRequestError extends Error {
		code: string;
		constructor(message: string, { code }: { code: string }) {
			super(message);
			this.name = "PrismaClientKnownRequestError";
			this.code = code;
		}
	}
	return { Prisma: { PrismaClientKnownRequestError } };
});

vi.mock("../utils/logger.js", () => ({
	logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Helper to import Prisma after mocking
import { Prisma } from "../generated/client.js";

function makeRes() {
	const res = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
	} as unknown as Response;
	return res;
}

function makeReq(overrides: Partial<Request> = {}): Request {
	return {
		path: "/test",
		method: "GET",
		body: {},
		...overrides,
	} as Request;
}

const next: NextFunction = vi.fn();

beforeEach(() => {
	vi.clearAllMocks();
	process.env["NODE_ENV"] = "test";
});

describe("errorHandler – Prisma known errors", () => {
	it("should respond 409 for P2002 (unique constraint violation)", () => {
		const err = new (Prisma.PrismaClientKnownRequestError as any)(
			"Unique constraint failed",
			{ code: "P2002" },
		);
		errorHandler(err, makeReq(), makeRes(), next);
		const res = makeRes();
		errorHandler(err, makeReq(), res, next);
		expect(res.status).toHaveBeenCalledWith(409);
		expect(res.json).toHaveBeenCalledWith({
			success: false,
			message: "Already exists",
		});
	});

	it("should respond 404 for P2025 (record not found)", () => {
		const err = new (Prisma.PrismaClientKnownRequestError as any)("Not found", {
			code: "P2025",
		});
		const res = makeRes();
		errorHandler(err, makeReq(), res, next);
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({
			success: false,
			message: "Not found",
		});
	});

	it("should respond 400 for P2003 (foreign key constraint)", () => {
		const err = new (Prisma.PrismaClientKnownRequestError as any)(
			"Foreign key failed",
			{ code: "P2003" },
		);
		const res = makeRes();
		errorHandler(err, makeReq(), res, next);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			success: false,
			message: "Related record exists",
		});
	});

	it("should respond 400 for P2014 (relation violation)", () => {
		const err = new (Prisma.PrismaClientKnownRequestError as any)(
			"Relation violation",
			{ code: "P2014" },
		);
		const res = makeRes();
		errorHandler(err, makeReq(), res, next);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			success: false,
			message: "Relation violation",
		});
	});
});

describe("errorHandler – AppError", () => {
	it("should respond with AppError status and message", () => {
		const err = new NotFoundError("Product not found");
		const res = makeRes();
		errorHandler(err, makeReq(), res, next);
		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({
			success: false,
			message: "Product not found",
		});
	});

	it("should handle any AppError status code", () => {
		const err = new AppError("Custom error", 422);
		const res = makeRes();
		errorHandler(err, makeReq(), res, next);
		expect(res.status).toHaveBeenCalledWith(422);
		expect(res.json).toHaveBeenCalledWith({
			success: false,
			message: "Custom error",
		});
	});
});

describe("errorHandler – unhandled errors", () => {
	it("should respond 500 for a generic Error", () => {
		const err = new Error("Unexpected failure");
		const res = makeRes();
		errorHandler(err, makeReq(), res, next);
		expect(res.status).toHaveBeenCalledWith(500);
		const call = (res.json as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as {
			success: boolean;
			message: string;
		};
		expect(call.success).toBe(false);
		expect(call.message).toBe("Unexpected failure");
	});

	it("should respond 500 for a non-Error value", () => {
		const res = makeRes();
		errorHandler("string error", makeReq(), res, next);
		expect(res.status).toHaveBeenCalledWith(500);
		const call = (res.json as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as {
			success: boolean;
			message: string;
		};
		expect(call.success).toBe(false);
		expect(call.message).toBe("Internal server error");
	});

	it("should include stack in development mode", () => {
		process.env["NODE_ENV"] = "development";
		const err = new Error("Dev error");
		const res = makeRes();
		errorHandler(err, makeReq(), res, next);
		const call = (res.json as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as {
			stack: string | undefined;
		};
		expect(call.stack).toBeDefined();
	});

	it("should omit stack in non-development mode", () => {
		process.env["NODE_ENV"] = "production";
		const err = new Error("Prod error");
		const res = makeRes();
		errorHandler(err, makeReq(), res, next);
		const call = (res.json as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as {
			stack: string | undefined;
		};
		expect(call.stack).toBeUndefined();
	});
});
