import { Redis } from "ioredis";

export const redis = new Redis(
	process.env.REDIS_URL || "redis://localhost:6379",
);

export const acquireLock = async (
	key: string,
	ttlSeconds: number,
): Promise<boolean> => {
	const result = await redis.set(
		`lock:stripe_event:${key}`,
		"processing",
		"EX",
		ttlSeconds,
		"NX",
	);
	return result === "OK";
};
