import { Router } from "express";
import express from "express";
import userController from "./user.controller.js";
import { verifyClerkWebhook } from "../../middlewares/webhook.middleware.js";

const router = Router();

router.post(
	"/webhook",
	express.raw({ type: "application/json" }),
	verifyClerkWebhook,
	userController.handleClerkWebhook,
);

export default router;
