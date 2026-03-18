import express, { Router } from "express";
import { requireApiAuth } from "../../middlewares/auth.middleware.js";
import { verifyClerkWebhook } from "../../middlewares/webhook.middleware.js";
import userController from "./user.controller.js";

const router = Router();

router.post(
	"/webhook",
	express.raw({ type: "application/json" }),
	verifyClerkWebhook,
	userController.handleClerkWebhook,
);

router.get("/me", requireApiAuth, userController.getMe);

export default router;
