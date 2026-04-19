import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import express from "express";
import { pinoHttp } from "pino-http";
import { startEmailConsumer } from "./consumers/email.consumer.js";
import { startMeiliConsumer } from "./consumers/meili.consumer.js";
import { startProductConsumer } from "./consumers/product.consumer.js";
import cartRouter from "./features/cart/cart.routes.js";
import categoryRoutes from "./features/category/category.routes.js";
import orderRoutes from "./features/order/order.routes.js";
import productRoutes from "./features/product/products.routes.js";
import uploadRoutes from "./features/upload/upload.routes.js";
import userRoutes from "./features/user/user.routes.js";
import webhookRoutes from "./features/webhooks/webhook.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { globalLimiter } from "./middlewares/rate.limit.middleware.js";
import { logger } from "./utils/logger.js";
import { setupMeilisearch } from "./utils/meilisearch.js";
import { setupGracefulShutdown } from "./utils/shutdown.js";
import { startOutboxWorker } from "./workers/outobox.worker.js";

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
app.use(globalLimiter);
app.use("/api/webhooks/", webhookRoutes);

app.use(express.json());
app.use(pinoHttp({ logger }));
app.use(clerkMiddleware());

app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRoutes);

app.use("/api/upload", uploadRoutes);

app.use(errorHandler);

const server = app.listen(PORT, () => {
	logger.info(`Server running on localhost:${PORT}`);

	startOutboxWorker().catch((err) => {
		logger.error({ err }, "Failed to start Outbox worker");
	});
	startEmailConsumer().catch((err) => {
		logger.error({ err }, "Failed to start Email consumer");
	});
	setupMeilisearch().catch((err) => {
		logger.error({ err }, "Failed to start MeiliSearch");
	});
	startMeiliConsumer().catch((err) => {
		logger.error({ err }, "Failed to start MeiliSearch Consumer");
	});
	startProductConsumer().catch((err) => {
		logger.error({ err }, "Failed to start MeiliSearch Consumer");
	});
});
setupGracefulShutdown(server);
