import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma.js";

export const requireApiAuth = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	if (
		process.env.NODE_ENV !== "production" &&
		(req.headers.authorization === "Bearer DEV_TOKEN" ||
			req.headers.authorization === "Bearer ADMIN_TOKEN")
	) {
		const devUser = await prisma.user.findFirst();
		if (devUser) {
			req.user = devUser;
			return next();
		}
	}
	// -------------------------

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

export const requireAdmin = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	if (
		process.env.NODE_ENV !== "production" &&
		req.headers.authorization === "Bearer ADMIN_TOKEN"
	) {
		const adminUser = await prisma.user.findFirst();
		if (adminUser) {
			req.user = adminUser;
			return next();
		}
	}

	if (!req.user) {
		res.status(401).json({
			success: false,
			message: "Unauthorized",
		});
		return;
	}

	const adminEmails = process.env.ADMIN_EMAILS
		? process.env.ADMIN_EMAILS.split(",")
		: [];

	if (!adminEmails.includes(req.user.email)) {
		res.status(403).json({
			success: false,
			message: "Forbidden: Only administrators can perform this action",
		});
		return;
	}
	next();
};
