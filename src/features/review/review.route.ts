import { Router } from "express";
import { requireApiAuth } from "@/middlewares/auth.middleware.js";
import { validate } from "@/middlewares/validate.js";
import reviewController from "./review.controller.js";
import { createReviewSchema, reviewsParamsSchema } from "./review.schema.js";

const router = Router();

router.post(
	"/",
	requireApiAuth,
	validate(createReviewSchema),
	reviewController.createReview,
);

router.get(
	"/product/:productId",
	validate(reviewsParamsSchema),
	reviewController.getProductReviewsById,
);

export default router;
