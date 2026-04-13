import { Server } from "http";
import { logger } from "./logger.js";
import { prisma } from "../db/prisma.js";
import { redis } from "./redis.js";

export const setupGracefulShutdown = (server: Server) => {
	const gracefulShutdown = async (signal: string) => {
		logger.info(`\n${signal} signal received: starting graceful shutdown...`);

		const forceDrop = setTimeout(() => {
			logger.error(
				"Could not close connections in time, forcefully shutting down",
			);
			process.exit(1);
		}, 10000);

		forceDrop.unref();

		server.close(async (err) => {
			if (err) {
				logger.error({ err }, "Error closing Express server");
				process.exit(1);
			}

			logger.info("Express server closed (no new requests accepted)");

			try {
				await prisma.$disconnect();
				logger.info("Prisma disconnected");

				await redis.quit();
				logger.info("Redis disconnected");
				logger.info("Graceful shutdown complete. Exiting process.");
				process.exit(0);
			} catch (shutdownError) {
				logger.error(
					{ err: shutdownError },
					"Error during database disconnect",
				);
				process.exit(1);
			}
		});
	};

	process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
	process.on("SIGINT", () => gracefulShutdown("SIGINT"));
};
