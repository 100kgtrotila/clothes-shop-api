import { Router } from "express";
import orderController from "./order.controller.js";
import { requireApiAuth } from "@/middlewares/auth.middleware.js";

const router = Router();

router.post("/checkout", requireApiAuth, orderController.cheokoutCart);

export default router;
