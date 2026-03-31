import { clerkMiddleware } from "@clerk/express";
import express from "express";
import cartRouter from "./features/cart/cart.routes.js";
import categoryRoutes from "./features/category/category.routes.js";
import productRoutes from "./features/product/products.routes.js";
import userController from "./features/user/user.controller.js";
import userRoutes from "./features/user/user.routes.js";
import orderRoutes from "./features/order/order.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { verifyClerkWebhook } from "./middlewares/webhook.middleware.js";
import { pinoHttp } from "pino-http";
import { logger } from "./utils/logger.js";
import cors from "cors";

const app = express();
const PORT = 3000;
const allowedOrigins = process.env.FRONTEND_URLS
	? process.env.FRONTEND_URLS.split(",")
	: ["http://localhost:5173"];

app.use(
	cors({
		origin: allowedOrigins,
		credentials: true,
	}),
);

app.post(
	"/api/users/webhook",
	express.raw({ type: "application/json" }),
	verifyClerkWebhook,
	userController.handleClerkWebhook,
);

app.use(express.json());
app.use(pinoHttp({ logger }));
app.use(clerkMiddleware());

app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`Server running on localhost:${PORT}`);
});
