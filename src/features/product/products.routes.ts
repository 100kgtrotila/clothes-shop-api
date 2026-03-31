import { Router } from "express";
import {
	requireApiAuth,
	requireAdmin,
} from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import productController from "./product.controller.js";
import {
	createProductSchema,
	deleteProductSchema,
	updateProductSchema,
} from "./product.schema.js";

const router = Router();

router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

router.post(
	"/",
	requireApiAuth,
	requireAdmin,
	validate(createProductSchema),
	productController.createProduct,
);
router.patch(
	"/:id",
	requireApiAuth,
	requireAdmin,
	validate(updateProductSchema),
	productController.updateProduct,
);

router.delete(
	"/:id",
	requireApiAuth,
	requireAdmin,
	validate(deleteProductSchema),
	productController.delete,
);

export default router;
