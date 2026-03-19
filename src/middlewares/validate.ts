import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema } from "zod";

export const validate = (schema: ZodSchema) => {
	return async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const result = await schema.parseAsync({
				body: req.body,
				query: req.query,
				params: req.params,
			});

			Object.assign(req, result);
			next();
		} catch (error) {
			if (error instanceof ZodError) {
				res.status(400).json({
					success: false,
					errors: error.issues.map((e) => e.message),
				});
				return;
			}
			next(error);
		}
	};
};
