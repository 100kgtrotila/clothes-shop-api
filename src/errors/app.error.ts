export class AppError extends Error {
	constructor(
		public message: string,
		public status: number,
	) {
		super(message);
		this.name = this.constructor.name;
	}
}
export class NotFoundError extends AppError {
	constructor(message = "Not found") {
		super(message, 404);
	}
}

export class ConflictError extends AppError {
	constructor(message = "Already exists") {
		super(message, 409);
	}
}

export class ForbiddenError extends AppError {
	constructor(message = "Forbidden") {
		super(message, 403);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = "Unauthorized") {
		super(message, 401);
	}
}

export class BadRequestError extends AppError {
	constructor(message = "Bad request") {
		super(message, 400);
	}
}
