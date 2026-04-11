import { logger } from "./logger.js";
import { redis } from "./redis.js";

export class CacheService {
	private defaultTtl: number;

	constructor(defaultTtl = 3600) {
		this.defaultTtl = defaultTtl;
	}

	async get<T>(key: string): Promise<T | null> {
		try {
			const data = await redis.get(key);
			if (!data) return null;
			return JSON.parse(data) as T;
		} catch (err) {
			logger.warn({ err, key }, "Redis get failed, falling back to DB");
			return null;
		}
	}

	async set<T>(key: string, value: T, ttl = this.defaultTtl): Promise<void> {
		try {
			const serialized = JSON.stringify(value, (_k, v) => {
				if (v !== null && typeof v === "object" && "toFixed" in v) {
					return Number(v);
				}
				return v;
			});
			await redis.set(key, serialized, "EX", ttl);
		} catch (err) {
			logger.warn({ err, key }, "Redis SET failed");
		}
	}

	async del(...keys: string[]): Promise<void> {
		if (keys.length === 0) return;
		try {
			await redis.del(...keys);
		} catch (err) {
			logger.warn({ err, keys }, "Redis del failed");
		}
	}

	async getOrSet<T>(
		key: string,
		fetchFn: () => Promise<T>,
		ttl = this.defaultTtl,
	): Promise<T> {
		const cached = await this.get<T>(key);
		if (cached !== null) {
			logger.info({ key }, "⚡ Cache HIT");
			return cached;
		}

		logger.info({ key }, "Cache MISS → fetching from DB");
		const data = await fetchFn();
		await this.set(key, data, ttl);
		return data;
	}

	async invalidateByPrefix(prefix: string): Promise<number> {
		return new Promise((resolve, reject) => {
			const keysToDelete: string[] = [];

			const stream = redis.scanStream({
				match: `${prefix}*`,
				count: 100,
			});

			stream.on("data", (keys: string[]) => {
				keysToDelete.push(...keys);
			});

			stream.on("end", async () => {
				if (keysToDelete.length === 0) {
					logger.info({ prefix }, "No cache keys to invalidate");
					resolve(0);
					return;
				}

				try {
					const pipeline = redis.pipeline();
					keysToDelete.forEach((key) => pipeline.del(key));
					await pipeline.exec();

					logger.info(
						{ prefix, count: keysToDelete.length },
						"Cache invalidated via SCAN",
					);
					resolve(keysToDelete.length);
				} catch (err) {
					reject(err);
				}
			});
			stream.on("error", reject);
		});
	}

	async withLock<T>(
		lockKey: string,
		fn: () => Promise<T>,
		ttlSeconds = 10,
	): Promise<T | null> {
		const acqured = await redis.set(lockKey, "1", "EX", ttlSeconds, "NX");
		if (!acqured) {
			logger.info({ lockKey }, "Lock not acquired, skipping");
			return null;
		}

		try {
			return await fn();
		} finally {
			await this.del(lockKey);
		}
	}

	buildKey(namespace: string, params: Record<string, unknown>): string {
		const sorted = Object.keys(params)
			.sort()
			.reduce<Record<string, unknown>>((acc, key) => {
				const val = params[key];
				if (val !== undefined && val !== null) {
					acc[key] = val;
				}
				return acc;
			}, {});
		return `${namespace}:${JSON.stringify(sorted)}`;
	}
}
