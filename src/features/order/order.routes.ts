import { Router } from "express";
import orderController from "./order.controller.js";
import { requireApiAuth, requireAdmin } from "@/middlewares/auth.middleware.js";
import { validate } from "@/middlewares/validate.js";
import {
	getMyOrdersSchema,
	getOrderByIdSchema,
	updateStatusOrderSchema,
} from "./order.schema.js";

const router = Router();

router.get(
	"/myOrders",
	requireApiAuth,
	validate(getMyOrdersSchema),
	orderController.getMyOrders,
);
router.post("/checkout", requireApiAuth, orderController.checkoutCart);
router.get(
	"/:id",
	requireApiAuth,
	validate(getOrderByIdSchema),
	orderController.getOrderById,
);

router.patch(
	"/:id/status",
	requireApiAuth,
	requireAdmin,
	validate(updateStatusOrderSchema),
	orderController.UpdateOrderStatus,
);
export default router;
