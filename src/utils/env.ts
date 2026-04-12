import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.url(),
	REDIS_URL: z.url(),
	CLERK_SECRET_KEY: z.string().min(1),
	STRIPE_SECRET_KEY: z.string().min(1),
	PORT: z.coerce.number().default(3000),
});

export const env = envSchema.parse(process.env);
