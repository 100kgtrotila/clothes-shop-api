import { Router } from "express";
import { createCategorySchema } from "./category.schema.js";
import { validate } from "../../middlewares/validate.js";

import categoryController from "./category.controller.js";

const router = Router();

router.get("/", categoryController.getAllCategories);
router.post(
	"/",
	validate(createCategorySchema),
	categoryController.createCategory,
);

export default router;
