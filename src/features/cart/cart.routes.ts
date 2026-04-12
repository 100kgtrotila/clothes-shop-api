import { Router } from "express";
import {
	requireApiAuth,
	requireAdmin,
} from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import cartController from "./cart.controller.js";
import {
	addCartItemSchema,
	deleteCartItemSchema,
	updateCartItemSchema,
} from "./cart.schema.js";

const router = Router();

router.get("/", requireApiAuth, cartController.getItems);
router.post(
	"/",
	requireApiAuth,
	validate(addCartItemSchema),
	cartController.addItem,
);
router.delete(
	"/:productId",
	requireApiAuth,
	validate(deleteCartItemSchema),
	cartController.deleteItem,
);

router.put(
	"/:productId",
	requireApiAuth,
	validate(updateCartItemSchema),
	cartController.updateItem,
);

export default router;
