import { Router } from "express";
import { requireApiAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import categoryController from "./category.controller.js";
import { createCategorySchema } from "./category.schema.js";

const router = Router();

router.get("/", categoryController.getAllCategories);
router.post(
	"/",
	requireApiAuth,
	validate(createCategorySchema),
	categoryController.createCategory,
);

export default router;
