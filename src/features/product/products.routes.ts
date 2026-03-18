import { Router } from "express";
import { requireApiAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import productController from "./product,controller.js";
import { createProductSchema } from "./product.schema.js";

const router = Router();

router.get("/", productController.getAllProducts);
router.post(
	"/",
	requireApiAuth,
	validate(createProductSchema),
	productController.createProduct,
);

export default router;
