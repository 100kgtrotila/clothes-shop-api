import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "@/utils/redis.js";

const redisStore = (prefix: string) =>
	new RedisStore({
		prefix: `rl:${prefix}:`,
		sendCommand: (...args: string[]) =>
			redis.call(...(args as [string, ...string[]])) as any,
	});

export const globalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100,
	standardHeaders: "draft-7",
	legacyHeaders: false,
	store: redisStore("global"),
	message: {
		success: false,
		message: "Too much requests",
	},
});

export const checkoutLimiter = rateLimit({
	windowMs: 10 * 60 * 1000,
	limit: 5,
	standardHeaders: "draft-7",
	legacyHeaders: false,
	store: redisStore("checkout"),
	keyGenerator: (req) => req.user?.id ?? req.ip ?? "anonymous",
	message: {
		success: false,
		message: "Too much requests",
	},
});

export const publicReadLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 200,
	standardHeaders: "draft-7",
	legacyHeaders: false,
	store: redisStore("public"),
	message: {
		success: false,
		message: "Забагато запитів",
	},
});
