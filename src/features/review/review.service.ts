import { prisma } from "@/db/prisma.js";
import { ConflictError, NotFoundError } from "@/errors/app.error.js";
import type { CreateReviewDto, ReviewParamsDto } from "./review.schema.js";

export class ReviewService {
	async createReview(userId: string, dto: CreateReviewDto) {
		const { productId, rating, comment } = dto;

		const productExists = await prisma.product.findUnique({
			where: { id: productId },
		});
		if (!productExists) {
			throw new NotFoundError("Product not found");
		}

		const existingReview = await prisma.review.findUnique({
			where: { userId_productId: { userId, productId } },
		});

		if (existingReview) {
			throw new ConflictError("You have already reviewed this product");
		}

		const newReview = await prisma.$transaction(async (tx) => {
			const review = await tx.review.create({
				data: {
					userId,
					productId,
					rating,
					...(comment !== undefined && { comment }),
				},
			});

			await tx.outboxEvent.create({
				data: {
					type: "review.created",
					payload: { productId },
				},
			});

			return review;
		});

		return newReview;
	}

	async getProductReviewsById(dto: ReviewParamsDto) {
		const { productId } = dto;

		const existingProduct = await prisma.product.findUnique({
			where: { id: productId },
		});

		if (!existingProduct) {
			throw new NotFoundError("Product does not exist!");
		}

		const reviews = await prisma.review.findMany({
			where: { productId: productId },
			orderBy: { createdAt: "desc" },
			include: { user: { select: { email: true } } },
		});

		return reviews;
	}
}

export default new ReviewService();
