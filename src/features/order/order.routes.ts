import { Router } from "express";
import orderController from "./order.controller.js";
import { requireApiAuth } from "@/middlewares/auth.middleware.js";
import { validate } from "@/middlewares/validate.js";
import { getMyOrdersSchema } from "./order.schema.js";

const router = Router();

router.get(
	"/myOrders",
	requireApiAuth,
	validate(getMyOrdersSchema),
	orderController.getMyOrders,
);
router.post("/checkout", requireApiAuth, orderController.cheokoutCart);

export default router;
