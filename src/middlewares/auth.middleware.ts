import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

export const requireApiAuth = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const auth = getAuth(req);

	if (!auth.userId) {
		res.status(401).json({
			success: false,
			message: "Unauthorized: Missing or invalid token",
		});
		return;
	}

	next();
};
