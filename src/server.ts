import { clerkMiddleware } from "@clerk/express";
import express from "express";
import categoryRoutes from "./features/category/category.routes.js";
import productRoutes from "./features/product/products.routes.js";
import userRoutes from "./features/user/user.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

const PORT = 3000;

app.use(clerkMiddleware());
app.use("/api/users", userRoutes);

app.use(express.json());

app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`Server running on localhost:${PORT}`);
});
