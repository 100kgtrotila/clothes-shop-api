import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../generated/client.js";

export const errorHandler = (
	err: any,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void => {
	console.log("Global Error", err.message || err);

	if (err instanceof Prisma.PrismaClientKnownRequestError) {
		if (err.code === "P2002") {
			res.status(409).json({
				success: false,
				message: "The record is already exists in db",
			});
			return;
		}
	}

	const statusCode = err.status || 500;
	res.status(statusCode).json({
		success: false,
		message: err.message || "Внутрішня помилка сервера",
		stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
	});
};
