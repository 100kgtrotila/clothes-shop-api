import { Router } from "express";
import { requireApiAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import cartController from "./cart.controller.js";
import {
	addItemCartSchema,
	deleteItemCartSchema,
	updateItemCartSchema,
} from "./cart.schema.js";

const router = Router();

router.get("/", requireApiAuth, cartController.getItems);
router.post(
	"/",
	requireApiAuth,
	validate(addItemCartSchema),
	cartController.addItem,
);
router.delete(
	"/:productId",
	requireApiAuth,
	validate(deleteItemCartSchema),
	cartController.deleteItem,
);

router.put(
	"/:productId",
	requireApiAuth,
	validate(updateItemCartSchema),
	cartController.updateItem,
);

export default router;
