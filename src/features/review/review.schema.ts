import z from "zod";

export const createReviewSchema = z.object({
	body: z.object({
		productId: z.uuid(),
		rating: z.number().int().min(1).max(5),
		comment: z.string().min(3).max(200).optional(),
	}),
});

export const reviewsParamsSchema = z.object({
	params: z.object({
		productId: z.string().uuid(),
	}),
});

export type CreateReviewDto = z.infer<typeof createReviewSchema>["body"];
export type ReviewParamsDto = z.infer<typeof reviewsParamsSchema>["params"];
