import { describe, expect, it } from "vitest";
import {
	AppError,
	BadRequestError,
	ConflictError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
} from "./app.error.js";

describe("AppError", () => {
	it("should create an AppError with message, status and correct name", () => {
		const err = new AppError("something went wrong", 422);
		expect(err.message).toBe("something went wrong");
		expect(err.status).toBe(422);
		expect(err.name).toBe("AppError");
	});

	it("should be an instance of Error", () => {
		const err = new AppError("test", 500);
		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(AppError);
	});
});

describe("NotFoundError", () => {
	it("should default to status 404 and message 'Not found'", () => {
		const err = new NotFoundError();
		expect(err.message).toBe("Not found");
		expect(err.status).toBe(404);
		expect(err.name).toBe("NotFoundError");
	});

	it("should accept a custom message", () => {
		const err = new NotFoundError("User not found");
		expect(err.message).toBe("User not found");
		expect(err.status).toBe(404);
	});

	it("should be an instance of AppError and Error", () => {
		const err = new NotFoundError();
		expect(err).toBeInstanceOf(AppError);
		expect(err).toBeInstanceOf(Error);
	});
});

describe("ConflictError", () => {
	it("should default to status 409 and message 'Already exists'", () => {
		const err = new ConflictError();
		expect(err.message).toBe("Already exists");
		expect(err.status).toBe(409);
		expect(err.name).toBe("ConflictError");
	});

	it("should accept a custom message", () => {
		const err = new ConflictError("Slug already taken");
		expect(err.message).toBe("Slug already taken");
		expect(err.status).toBe(409);
	});
});

describe("ForbiddenError", () => {
	it("should default to status 403 and message 'Forbidden'", () => {
		const err = new ForbiddenError();
		expect(err.message).toBe("Forbidden");
		expect(err.status).toBe(403);
		expect(err.name).toBe("ForbiddenError");
	});

	it("should accept a custom message", () => {
		const err = new ForbiddenError("Access denied");
		expect(err.message).toBe("Access denied");
		expect(err.status).toBe(403);
	});
});

describe("UnauthorizedError", () => {
	it("should default to status 401 and message 'Unauthorized'", () => {
		const err = new UnauthorizedError();
		expect(err.message).toBe("Unauthorized");
		expect(err.status).toBe(401);
		expect(err.name).toBe("UnauthorizedError");
	});

	it("should accept a custom message", () => {
		const err = new UnauthorizedError("Token expired");
		expect(err.message).toBe("Token expired");
		expect(err.status).toBe(401);
	});
});

describe("BadRequestError", () => {
	it("should default to status 400 and message 'Bad request'", () => {
		const err = new BadRequestError();
		expect(err.message).toBe("Bad request");
		expect(err.status).toBe(400);
		expect(err.name).toBe("BadRequestError");
	});

	it("should accept a custom message", () => {
		const err = new BadRequestError("Invalid input");
		expect(err.message).toBe("Invalid input");
		expect(err.status).toBe(400);
	});
});
