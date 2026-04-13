import { Router } from "express";
import multer from "multer";
import {
	requireAdmin,
	requireApiAuth,
} from "../../middlewares/auth.middleware.js";
import uploadController from "./upload.controller.js";

const router = Router();

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 },
});

router.post(
	"/",
	requireApiAuth,
	requireAdmin,
	upload.single("image"),
	uploadController.uploadImage,
);

export default router;
