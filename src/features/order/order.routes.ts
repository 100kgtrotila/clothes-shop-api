import { Router } from "express";
import orderController from "./order.controller.js";
import { requireApiAuth } from "@/middlewares/auth.middleware.js";
import { validate } from "@/middlewares/validate.js";
import { getMyOrdersSchema, getOrderByIdSchema } from "./order.schema.js";

const router = Router();

router.get(
	"/myOrders",
	requireApiAuth,
	validate(getMyOrdersSchema),
	orderController.getMyOrders,
);
router.post("/checkout", requireApiAuth, orderController.cheokoutCart);
router.get(
	"/:id",
	requireApiAuth,
	validate(getOrderByIdSchema),
	orderController.getOrderById,
);
export default router;
