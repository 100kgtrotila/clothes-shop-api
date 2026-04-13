import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app.error.js";
import { Prisma } from "../generated/client.js";
import { logger } from "../utils/logger.js";

export const errorHandler = (
	err: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void => {
	if (err instanceof Prisma.PrismaClientKnownRequestError) {
		if (err.code === "P2002") {
			res.status(409).json({ success: false, message: "Already exists" });
			return;
		}
		if (err.code === "P2025") {
			res.status(404).json({ success: false, message: "Not found" });
			return;
		}
		if (err.code === "P2003") {
			res
				.status(400)
				.json({ success: false, message: "Related record exists" });
			return;
		}
		if (err.code === "P2014") {
			res.status(400).json({ success: false, message: "Relation violation" });
			return;
		}
	}

	if (err instanceof AppError) {
		logger.warn({ path: _req.path, message: err.message }, "Бізнес-помилка");
		res.status(err.status).json({ success: false, message: err.message });
		return;
	}

	logger.error(
		{ err, path: _req.path, method: _req.method, body: _req.body },
		"[UNHANDLED ERROR] Server Error",
	);

	const message = err instanceof Error ? err.message : "Internal server error";
	const stack = err instanceof Error ? err.stack : undefined;

	res.status(500).json({
		success: false,
		message,
		stack: process.env.NODE_ENV === "development" ? stack : undefined,
	});
};
