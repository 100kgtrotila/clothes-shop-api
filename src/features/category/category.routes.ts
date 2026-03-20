import { Router } from "express";
import { requireApiAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import categoryController from "./category.controller.js";
import {
	createCategorySchema,
	deleteCategorySchema,
	updateCategorySchema,
} from "./category.schema.js";

const router = Router();

router.get("/", categoryController.getAllCategories);
router.post(
	"/",
	requireApiAuth,
	validate(createCategorySchema),
	categoryController.createCategory,
);

router.patch(
	"/:id",
	requireApiAuth,
	validate(updateCategorySchema),
	categoryController.updateCategory,
);

router.delete(
	"/:id",
	requireApiAuth,
	validate(deleteCategorySchema),
	categoryController.deleteCategory,
);

export default router;
