import { Router } from "express";
import { requireApiAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.js";
import cartController from "./cart.controller.js";
import { addItemCartSchema } from "./cart.schema.js";

const router = Router();

router.get("/", requireApiAuth, cartController.getCartItems);
router.post(
	"/",
	requireApiAuth,
	validate(addItemCartSchema),
	cartController.addItem,
);

export default router;
