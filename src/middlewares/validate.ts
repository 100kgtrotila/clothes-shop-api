import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const validate = (schema: z.ZodSchema) => {
	return async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		const result = await schema.safeParseAsync({
			body: req.body,
			query: req.query,
			params: req.params,
		});

		if (!result.success) {
			res.status(400).json({
				success: false,
				message: "Validation error",
				errors: result.error.issues.map((e: z.ZodIssue) => ({
					path: e.path.join("."),
					message: e.message,
				})),
			});
			return;
		}

		const validData = result.data as {
			body?: any;
			query?: any;
			params?: any;
		};

		if (validData.body) {
			req.body = validData.body;
		}

		if (validData.query) {
			Object.defineProperty(req, "query", {
				value: validData.query,
				enumerable: true,
			});
		}

		if (validData.params) {
			Object.defineProperty(req, "params", {
				value: validData.params,
				enumerable: true,
			});
		}

		next();
	};
};
