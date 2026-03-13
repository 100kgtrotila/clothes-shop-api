import express, { type Request, type Response } from 'express';
import { clerkMiddleware } from '@clerk/express'
import categoryRoutes from './features/category/category.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express()
const PORT = 3000;

app.use(express.json());

app.use(clerkMiddleware());

app.use('/api/categories', categoryRoutes);

app.use(errorHandler)


app.listen(PORT, () => {
    console.log(`Server running on localhost:${PORT}`)
});
