import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma.js";

export const requireApiAuth = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	const auth = getAuth(req);

	if (!auth.userId) {
		res.status(401).json({
			success: false,
			message: "Unauthorized: Missing or invalid token",
		});
		return;
	}

	const user = await prisma.user.findUnique({
		where: { clerkId: auth.userId },
	});

	if (!user) {
		res.status(401).json({
			success: false,
			message: "User not found",
		});
		return;
	}

	req.user = user;
	next();
};
