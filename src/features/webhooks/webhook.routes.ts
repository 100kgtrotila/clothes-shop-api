import express, { Router } from "express";
import { verifyClerkWebhook } from "../../middlewares/webhook.middleware.js";
import orderController from "../order/order.controller.js";
import userController from "../user/user.controller.js";

const webhookRouter = Router();

webhookRouter.use(express.raw({ type: "application/json" }));

// Clerk
webhookRouter.post(
	"/clerk",
	verifyClerkWebhook,
	userController.handleClerkWebhook,
);

// Stripe
webhookRouter.post("/stripe", orderController.handleStripeWebhook);

export default webhookRouter;
