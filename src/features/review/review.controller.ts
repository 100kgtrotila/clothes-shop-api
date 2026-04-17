import type { Request, Response } from "express";
import type { ReviewParamsDto } from "./review.schema.js";
import reviewService from "./review.service.js";

export class ReviewController {
	async createReview(req: Request, res: Response) {
		const userId = req.user.id;
		const newReview = await reviewService.createReview(userId, req.body);
		res.status(201).json({
			success: true,
			data: newReview,
		});
	}

	async getProductReviewsById(req: Request, res: Response) {
		const { productId } = req.params as unknown as ReviewParamsDto;

		const reviews = await reviewService.getProductReviewsById({ productId });

		res.status(200).json({
			success: true,
			data: reviews,
		});
	}
}

export default new ReviewController();
