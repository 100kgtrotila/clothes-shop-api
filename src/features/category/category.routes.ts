import { Router } from "express";
import { createCategorySchema } from "./category.schema.js";
import { validate } from "../../middlewares/validate.js";
import { requireApiAuth } from "../../middlewares/auth.middleware.js";
import categoryController from "./category.controller.js";

const router = Router();

router.get("/", categoryController.getAllCategories);
router.post(
	"/",
	requireApiAuth,
	validate(createCategorySchema),
	categoryController.createCategory,
);

export default router;
