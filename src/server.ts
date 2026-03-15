import express from "express";
import { clerkMiddleware } from "@clerk/express";
import categoryRoutes from "./features/category/category.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import userRoutes from "./features/user/user.routes.js";

const app = express();

const PORT = 3000;

app.use(clerkMiddleware());
app.use("/api/users", userRoutes);

app.use(express.json());

app.post("/api/test", (req, res) => {
	res.json({ message: "Бекенд живий і бачить POST запит!" });
});
app.get("/api/test", (req, res) => {
	res.json({ message: "Бекенд живий і бачить GET запит!" });
});

app.use("/api/categories", categoryRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`Server running on localhost:${PORT}`);
});
