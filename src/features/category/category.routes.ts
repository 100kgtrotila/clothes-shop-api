import { Router } from "express";
import {
	requireApiAuth,
	requireAdmin,
} from "../../middlewares/auth.middleware.js";
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
	requireAdmin,
	validate(createCategorySchema),
	categoryController.createCategory,
);

router.patch(
	"/:id",
	requireApiAuth,
	requireAdmin,
	validate(updateCategorySchema),
	categoryController.updateCategory,
);

router.delete(
	"/:id",
	requireApiAuth,
	requireAdmin,
	validate(deleteCategorySchema),
	categoryController.deleteCategory,
);

export default router;
